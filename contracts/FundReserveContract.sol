// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FundReserveContract
 * @dev Stores ML-predicted monthly reserve allocations on-chain.
 *      The Python XGBoost model runs off-chain and pushes results here.
 *      Only the insurer (contract deployer) can push predictions.
 */
contract FundReserveContract {

    address public insurer;

    // ================================
    // STRUCTS
    // ================================

    struct MonthlyReserve {
        uint256 year;
        uint256 month;
        uint256 predictedClaims;   // XGBoost predicted total (scaled x1000 to avoid decimals)
        uint256 ibnrAmount;        // Incurred But Not Reported (15.5%)
        uint256 rbnsAmount;        // Reported But Not Settled (26.3%)
        uint256 riskBuffer;        // Dynamic risk buffer
        uint256 totalReserve;      // Sum of all components
        uint256 claimCount;        // Number of claims in this month
        uint256 actualClaims;      // Filled after month ends (0 if future)
        uint256 errorPct;          // Prediction error % x100 (e.g. 120 = 1.20%)
        string  modelVersion;      // e.g. "v2023.01"
        uint256 updatedAt;         // block.timestamp
        bool    isFinalized;       // true once actual claims are recorded
    }

    struct ModelMetadata {
        string  modelVersion;
        uint256 r2Score;           // R² x10000 (e.g. 7356 = 73.56%)
        uint256 maeValue;          // MAE x100 (e.g. 2227 = $22.27)
        uint256 mapeValue;         // MAPE x100 (e.g. 258 = 2.58%)
        uint256 trainSize;         // Number of training records
        uint256 updatedAt;
    }

    struct WeeklyAlert {
        uint256 year;
        uint256 month;
        uint256 week;              // 1-4
        uint256 actualSpendSoFar;  // Scaled x1000
        uint256 expectedByNow;     // Scaled x1000
        uint256 deviationPct;      // x100
        string  alertLevel;        // "Normal" | "Warning" | "Critical"
        string  message;
        uint256 createdAt;
    }

    struct RebalanceRecord {
        uint256 fromMonth;
        uint256 toMonth;
        uint256 year;
        uint256 amountTransferred;  // Scaled x1000
        string  reason;
        uint256 executedAt;
    }

    // ================================
    // STORAGE
    // ================================

    // scenario => year => month => MonthlyReserve
    // scenario 1 = Initial Reserve Allocation (Baseline)
    // scenario 2 = Rolling Monthly Forecast
    mapping(uint256 => mapping(uint256 => mapping(uint256 => MonthlyReserve))) public scenarioReserves;

    // Backward-compat alias: scenario 1 reserves (default)
    mapping(uint256 => mapping(uint256 => MonthlyReserve)) public reserves;

    // Latest model metadata per scenario
    mapping(uint256 => ModelMetadata) public scenarioModel;

    // Latest model metadata (scenario 1 default)
    ModelMetadata public latestModel;

    // Weekly alerts array
    WeeklyAlert[] public weeklyAlerts;

    // Rebalance history
    RebalanceRecord[] public rebalanceHistory;

    // Track which (year, month) pairs have data
    uint256[] public reserveYears;
    mapping(uint256 => uint256[]) public reserveMonthsByYear;

    // ================================
    // EVENTS
    // ================================

    event ReservePushed(
        uint256 indexed year,
        uint256 indexed month,
        uint256 totalReserve,
        string  modelVersion,
        uint256 timestamp
    );

    event ActualClaimsRecorded(
        uint256 indexed year,
        uint256 indexed month,
        uint256 actualClaims,
        uint256 errorPct,
        uint256 timestamp
    );

    event ModelUpdated(
        string  modelVersion,
        uint256 r2Score,
        uint256 mapeValue,
        uint256 timestamp
    );

    event WeeklyAlertCreated(
        uint256 indexed year,
        uint256 indexed month,
        uint256 week,
        string  alertLevel,
        uint256 timestamp
    );

    event RebalanceExecuted(
        uint256 fromMonth,
        uint256 toMonth,
        uint256 amount,
        uint256 timestamp
    );

    // ================================
    // MODIFIER
    // ================================

    modifier onlyInsurer() {
        require(msg.sender == insurer, "Only insurer allowed");
        _;
    }

    // ================================
    // CONSTRUCTOR
    // ================================

    constructor() {
        insurer = msg.sender;
    }

    // ================================
    // PUSH MONTHLY RESERVE (Python calls this)
    // All amounts scaled x1000 (multiply by 1000 before sending)
    // ================================

    function pushMonthlyReserve(
        uint256 _year,
        uint256 _month,
        uint256 _predictedClaims,
        uint256 _ibnrAmount,
        uint256 _rbnsAmount,
        uint256 _riskBuffer,
        uint256 _totalReserve,
        uint256 _claimCount,
        string memory _modelVersion
    ) public onlyInsurer {
        require(_month >= 1 && _month <= 12, "Invalid month");

        // Track year/month index
        if (reserves[_year][_month].updatedAt == 0) {
            bool yearExists = false;
            for (uint i = 0; i < reserveYears.length; i++) {
                if (reserveYears[i] == _year) { yearExists = true; break; }
            }
            if (!yearExists) reserveYears.push(_year);
            reserveMonthsByYear[_year].push(_month);
        }

        MonthlyReserve memory r = MonthlyReserve({
            year:            _year,
            month:           _month,
            predictedClaims: _predictedClaims,
            ibnrAmount:      _ibnrAmount,
            rbnsAmount:      _rbnsAmount,
            riskBuffer:      _riskBuffer,
            totalReserve:    _totalReserve,
            claimCount:      _claimCount,
            actualClaims:    0,
            errorPct:        0,
            modelVersion:    _modelVersion,
            updatedAt:       block.timestamp,
            isFinalized:     false
        });

        reserves[_year][_month] = r;
        scenarioReserves[1][_year][_month] = r;

        emit ReservePushed(_year, _month, _totalReserve, _modelVersion, block.timestamp);
    }

    // Push for a specific scenario (1=Baseline, 2=Rolling)
    function pushMonthlyReserveScenario(
        uint256 _scenario,
        uint256 _year,
        uint256 _month,
        uint256 _predictedClaims,
        uint256 _ibnrAmount,
        uint256 _rbnsAmount,
        uint256 _riskBuffer,
        uint256 _totalReserve,
        uint256 _claimCount,
        string memory _modelVersion
    ) public onlyInsurer {
        require(_month >= 1 && _month <= 12, "Invalid month");
        require(_scenario == 1 || _scenario == 2, "Invalid scenario");

        if (_scenario == 1) {
            pushMonthlyReserve(_year, _month, _predictedClaims, _ibnrAmount,
                               _rbnsAmount, _riskBuffer, _totalReserve, _claimCount, _modelVersion);
            return;
        }

        // Scenario 2 — track separately
        if (scenarioReserves[2][_year][_month].updatedAt == 0) {
            bool yearExists = false;
            for (uint i = 0; i < reserveYears.length; i++) {
                if (reserveYears[i] == _year) { yearExists = true; break; }
            }
            if (!yearExists) reserveYears.push(_year);
        }

        scenarioReserves[_scenario][_year][_month] = MonthlyReserve({
            year:            _year,
            month:           _month,
            predictedClaims: _predictedClaims,
            ibnrAmount:      _ibnrAmount,
            rbnsAmount:      _rbnsAmount,
            riskBuffer:      _riskBuffer,
            totalReserve:    _totalReserve,
            claimCount:      _claimCount,
            actualClaims:    0,
            errorPct:        0,
            modelVersion:    _modelVersion,
            updatedAt:       block.timestamp,
            isFinalized:     false
        });

        emit ReservePushed(_year, _month, _totalReserve, _modelVersion, block.timestamp);
    }

    // ================================
    // PUSH FULL YEAR (batch — all 12 months at once)
    // ================================

    function pushYearlyReserves(
        uint256 _year,
        uint256[12] memory _predictedClaims,
        uint256[12] memory _ibnrAmounts,
        uint256[12] memory _rbnsAmounts,
        uint256[12] memory _riskBuffers,
        uint256[12] memory _totalReserves,
        uint256[12] memory _claimCounts,
        string memory _modelVersion
    ) public onlyInsurer {
        for (uint256 m = 1; m <= 12; m++) {
            pushMonthlyReserve(
                _year, m,
                _predictedClaims[m-1],
                _ibnrAmounts[m-1],
                _rbnsAmounts[m-1],
                _riskBuffers[m-1],
                _totalReserves[m-1],
                _claimCounts[m-1],
                _modelVersion
            );
        }
    }

    // ================================
    // RECORD ACTUAL CLAIMS (month-end)
    // ================================

    function recordActualClaims(
        uint256 _year,
        uint256 _month,
        uint256 _actualClaims
    ) public onlyInsurer {
        require(reserves[_year][_month].updatedAt > 0, "Reserve not found");

        MonthlyReserve storage r = reserves[_year][_month];

        uint256 errorPct = 0;
        if (_actualClaims > 0) {
            uint256 diff = r.predictedClaims > _actualClaims
                ? r.predictedClaims - _actualClaims
                : _actualClaims - r.predictedClaims;
            errorPct = (diff * 10000) / _actualClaims; // x100 for 2 decimal places
        }

        r.actualClaims = _actualClaims;
        r.errorPct     = errorPct;
        r.isFinalized  = true;

        emit ActualClaimsRecorded(_year, _month, _actualClaims, errorPct, block.timestamp);
    }

    // ================================
    // UPDATE MODEL METADATA
    // ================================

    function updateModelMetadata(
        string memory _version,
        uint256 _r2Score,
        uint256 _maeValue,
        uint256 _mapeValue,
        uint256 _trainSize
    ) public onlyInsurer {
        latestModel = ModelMetadata({
            modelVersion: _version,
            r2Score:      _r2Score,
            maeValue:     _maeValue,
            mapeValue:    _mapeValue,
            trainSize:    _trainSize,
            updatedAt:    block.timestamp
        });

        emit ModelUpdated(_version, _r2Score, _mapeValue, block.timestamp);
    }

    // ================================
    // PUSH WEEKLY ALERT
    // ================================

    function pushWeeklyAlert(
        uint256 _year,
        uint256 _month,
        uint256 _week,
        uint256 _actualSpend,
        uint256 _expectedSpend,
        uint256 _deviationPct,
        string memory _alertLevel,
        string memory _message
    ) public onlyInsurer {
        weeklyAlerts.push(WeeklyAlert({
            year:             _year,
            month:            _month,
            week:             _week,
            actualSpendSoFar: _actualSpend,
            expectedByNow:    _expectedSpend,
            deviationPct:     _deviationPct,
            alertLevel:       _alertLevel,
            message:          _message,
            createdAt:        block.timestamp
        }));

        emit WeeklyAlertCreated(_year, _month, _week, _alertLevel, block.timestamp);
    }

    // ================================
    // RECORD REBALANCE
    // ================================

    function recordRebalance(
        uint256 _fromMonth,
        uint256 _toMonth,
        uint256 _year,
        uint256 _amount,
        string memory _reason
    ) public onlyInsurer {
        rebalanceHistory.push(RebalanceRecord({
            fromMonth:        _fromMonth,
            toMonth:          _toMonth,
            year:             _year,
            amountTransferred: _amount,
            reason:           _reason,
            executedAt:       block.timestamp
        }));

        emit RebalanceExecuted(_fromMonth, _toMonth, _amount, block.timestamp);
    }

    // ================================
    // VIEW FUNCTIONS
    // ================================

    function getMonthlyReserve(uint256 _year, uint256 _month)
        public view returns (MonthlyReserve memory)
    {
        return reserves[_year][_month];
    }

    function getYearlyReserves(uint256 _year)
        public view returns (MonthlyReserve[] memory)
    {
        uint256[] memory months = reserveMonthsByYear[_year];
        MonthlyReserve[] memory result = new MonthlyReserve[](months.length);
        for (uint i = 0; i < months.length; i++) {
            result[i] = reserves[_year][months[i]];
        }
        return result;
    }

    function getYearlyReservesByScenario(uint256 _scenario, uint256 _year)
        public view returns (MonthlyReserve[] memory)
    {
        MonthlyReserve[] memory result = new MonthlyReserve[](12);
        for (uint256 m = 1; m <= 12; m++) {
            result[m-1] = scenarioReserves[_scenario][_year][m];
        }
        return result;
    }

    function updateScenarioModelMetadata(
        uint256 _scenario,
        string memory _version,
        uint256 _r2Score,
        uint256 _maeValue,
        uint256 _mapeValue,
        uint256 _trainSize
    ) public onlyInsurer {
        ModelMetadata memory meta = ModelMetadata({
            modelVersion: _version,
            r2Score:      _r2Score,
            maeValue:     _maeValue,
            mapeValue:    _mapeValue,
            trainSize:    _trainSize,
            updatedAt:    block.timestamp
        });
        scenarioModel[_scenario] = meta;
        if (_scenario == 1) {
            latestModel = meta;
        }
        emit ModelUpdated(_version, _r2Score, _mapeValue, block.timestamp);
    }

    function getLatestAlerts(uint256 count)
        public view returns (WeeklyAlert[] memory)
    {
        uint256 len = weeklyAlerts.length;
        uint256 returnCount = count > len ? len : count;
        WeeklyAlert[] memory result = new WeeklyAlert[](returnCount);
        for (uint i = 0; i < returnCount; i++) {
            result[i] = weeklyAlerts[len - returnCount + i];
        }
        return result;
    }

    function getRebalanceHistory()
        public view returns (RebalanceRecord[] memory)
    {
        return rebalanceHistory;
    }

    function getReserveYears()
        public view returns (uint256[] memory)
    {
        return reserveYears;
    }
}
