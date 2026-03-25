"""
REAL-WORLD PRODUCTION WORKFLOW
===============================
Shows how the system works with a database in production

DATABASE STRUCTURE:
-------------------
1. claims_table: Stores all claim records
2. predictions_table: Stores monthly predictions
3. reserves_table: Stores reserve allocations
4. model_metadata: Stores model versions and performance

MONTHLY WORKFLOW:
-----------------
1. Read actual claims from database (month-by-month)
2. Retrain model with updated data
3. Predict remaining months
4. Update reserve allocations
5. Store results back to database
"""

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# SIMULATED DATABASE CONNECTION
# ============================================================================
class InsuranceDatabase:
    """
    Simulates a real database connection
    In production, this would be:
    - PostgreSQL / MySQL / SQL Server
    - MongoDB (NoSQL)
    - Cloud database (AWS RDS, Azure SQL, Google Cloud SQL)
    """
    
    def __init__(self, csv_path):
        """Initialize with CSV (simulating database)"""
        self.data = pd.read_csv(csv_path, low_memory=False)
        print("✅ Connected to database")
    
    def get_claims_by_date_range(self, start_year, end_year, start_month=1, end_month=12):
        """
        Simulates: SELECT * FROM claims WHERE year BETWEEN ? AND ? AND month BETWEEN ? AND ?
        """
        query_result = self.data[
            ((self.data['year'] == start_year) & (self.data['claim_date'] >= start_month)) |
            ((self.data['year'] > start_year) & (self.data['year'] < end_year)) |
            ((self.data['year'] == end_year) & (self.data['claim_date'] <= end_month))
        ].copy()
        
        print(f"   📊 Query: Claims from {start_year}-{start_month:02d} to {end_year}-{end_month:02d}")
        print(f"   📊 Result: {len(query_result):,} claims retrieved")
        return query_result
    
    def get_claims_for_month(self, year, month):
        """
        Simulates: SELECT * FROM claims WHERE year = ? AND month = ?
        """
        query_result = self.data[
            (self.data['year'] == year) & (self.data['claim_date'] == month)
        ].copy()
        
        print(f"   📊 Query: Claims for {year}-{month:02d}")
        print(f"   📊 Result: {len(query_result):,} claims retrieved")
        return query_result
    
    def save_predictions(self, predictions_df, table_name='predictions'):
        """
        Simulates: INSERT INTO predictions VALUES (...)
        """
        print(f"   💾 Saving {len(predictions_df)} predictions to {table_name} table")
        # In production: predictions_df.to_sql(table_name, con=db_connection, if_exists='append')
        return True
    
    def save_reserves(self, reserves_df, table_name='reserves'):
        """
        Simulates: INSERT INTO reserves VALUES (...)
        """
        print(f"   💾 Saving {len(reserves_df)} reserve allocations to {table_name} table")
        # In production: reserves_df.to_sql(table_name, con=db_connection, if_exists='append')
        return True
    
    def get_latest_model_version(self):
        """
        Simulates: SELECT MAX(version) FROM model_metadata
        """
        return "v2023.12"

# ============================================================================
# PRODUCTION WORKFLOW - MONTHLY RETRAINING
# ============================================================================
def monthly_retraining_workflow(db, current_year, current_month):
    """
    Real-world monthly workflow
    
    This runs on the 1st of each month:
    1. Read actual claims from previous month
    2. Retrain model with all historical data
    3. Predict remaining months
    4. Update reserve allocations
    """
    
    print("\n" + "=" * 100)
    print(f"MONTHLY RETRAINING WORKFLOW - {current_year}-{current_month:02d}")
    print("=" * 100)
    
    # ========================================================================
    # STEP 1: READ TRAINING DATA FROM DATABASE
    # ========================================================================
    print(f"\n📂 STEP 1: Reading training data from database...")
    
    # Get all historical data up to previous month
    if current_month == 1:
        # January: Use all data from previous years
        train_data = db.get_claims_by_date_range(2018, current_year - 1)
    else:
        # Other months: Include current year up to previous month
        train_data = db.get_claims_by_date_range(2018, current_year, 1, current_month - 1)
    
    print(f"   ✅ Training data: {len(train_data):,} claims")
    
    # ========================================================================
    # STEP 2: READ TEST DATA (REMAINING MONTHS)
    # ========================================================================
    print(f"\n📂 STEP 2: Reading test data for remaining months...")
    
    # Get data for remaining months of current year
    test_data = db.get_claims_by_date_range(current_year, current_year, current_month, 12)
    
    print(f"   ✅ Test data: {len(test_data):,} claims ({13 - current_month} months)")
    
    # ========================================================================
    # STEP 3: TRAIN MODEL
    # ========================================================================
    print(f"\n🤖 STEP 3: Training XGBoost model...")
    
    # Feature engineering (simplified for demo)
    def prepare_features(df):
        df = df.copy()
        df['month'] = df['claim_date']
        
        # Basic features
        features = [
            'claim_amount_requested', 'patient_age', 
            'comorbidity_count', 'condition_priority',
            'education_years', 'poverty_category',
            'plan_category', 'premium_level', 'deductible_category',
            'plan_type_hmo', 'month'
        ]
        
        X = df[features].fillna(0)
        y = df['claim_amount_approved']
        
        return X, y
    
    X_train, y_train = prepare_features(train_data)
    X_test, y_test = prepare_features(test_data)
    
    # Remove invalid values
    valid_train = (y_train.notna()) & (y_train >= 0) & (y_train < 1e9)
    valid_test = (y_test.notna()) & (y_test >= 0) & (y_test < 1e9)
    
    X_train = X_train[valid_train]
    y_train = y_train[valid_train]
    X_test = X_test[valid_test]
    y_test = y_test[valid_test]
    test_data = test_data[valid_test]
    
    # Scale
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.03,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train, verbose=False)
    
    print(f"   ✅ Model trained on {len(X_train):,} claims")
    
    # ========================================================================
    # STEP 4: MAKE PREDICTIONS
    # ========================================================================
    print(f"\n🔮 STEP 4: Making predictions for remaining months...")
    
    y_pred = model.predict(X_test_scaled)
    y_pred = np.maximum(y_pred, 0)
    
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"   ✅ R² = {r2:.4f} ({r2*100:.2f}%)")
    print(f"   ✅ MAE = ${mae:,.2f}")
    
    # ========================================================================
    # STEP 5: CALCULATE RESERVES
    # ========================================================================
    print(f"\n💰 STEP 5: Calculating reserve allocations...")
    
    test_data['predicted_approved'] = y_pred
    
    monthly_reserves = test_data.groupby('claim_date').agg(
        actual=('claim_amount_approved', 'sum'),
        predicted=('predicted_approved', 'sum'),
        count=('claim_amount_approved', 'count')
    ).reset_index()
    
    # Add reserve components
    monthly_reserves['ibnr'] = monthly_reserves['predicted'] * 0.155
    monthly_reserves['rbns'] = monthly_reserves['predicted'] * 0.263
    monthly_reserves['risk_buffer'] = monthly_reserves['predicted'] * 0.10
    monthly_reserves['total_reserve'] = (
        monthly_reserves['predicted'] + 
        monthly_reserves['ibnr'] + 
        monthly_reserves['rbns'] + 
        monthly_reserves['risk_buffer']
    )
    
    print(f"   ✅ Reserves calculated for {len(monthly_reserves)} months")
    
    # ========================================================================
    # STEP 6: SAVE TO DATABASE
    # ========================================================================
    print(f"\n💾 STEP 6: Saving results to database...")
    
    # Save predictions
    predictions_df = test_data[['patient_id', 'year', 'claim_date', 
                                 'claim_amount_approved', 'predicted_approved']].copy()
    predictions_df['prediction_date'] = datetime.now()
    predictions_df['model_version'] = db.get_latest_model_version()
    
    db.save_predictions(predictions_df)
    
    # Save reserves
    reserves_df = monthly_reserves.copy()
    reserves_df['year'] = current_year
    reserves_df['calculation_date'] = datetime.now()
    reserves_df['model_version'] = db.get_latest_model_version()
    
    db.save_reserves(reserves_df)
    
    print(f"   ✅ Results saved to database")
    
    # ========================================================================
    # STEP 7: RETURN SUMMARY
    # ========================================================================
    total_reserve = monthly_reserves['total_reserve'].sum()
    
    print(f"\n{'='*100}")
    print(f"SUMMARY - {current_year}-{current_month:02d}")
    print(f"{'='*100}")
    print(f"   Training data:    {len(train_data):,} claims")
    print(f"   Predictions:      {len(test_data):,} claims ({13 - current_month} months)")
    print(f"   Model accuracy:   R² = {r2:.4f} ({r2*100:.2f}%)")
    print(f"   Total reserve:    ${total_reserve:,.0f}")
    print(f"   Status:           ✅ Complete")
    
    return {
        'month': current_month,
        'train_size': len(train_data),
        'test_size': len(test_data),
        'r2': r2,
        'mae': mae,
        'total_reserve': total_reserve
    }

# ============================================================================
# MAIN EXECUTION
# ============================================================================
if __name__ == "__main__":
    
    print("=" * 100)
    print("PRODUCTION WORKFLOW SIMULATION")
    print("Demonstrates real-world database integration")
    print("=" * 100)
    
    # Initialize database connection
    print("\n🔌 Connecting to database...")
    db = InsuranceDatabase(os.path.join(os.path.dirname(__file__), 'ENHANCED_CLAIMS_2018_2023_FOR_DEMO.csv'))
    
    # Simulate monthly retraining for 2023
    print("\n" + "=" * 100)
    print("SIMULATING 2023 MONTHLY RETRAINING")
    print("=" * 100)
    
    results = []
    
    # Run for first 3 months as demo
    for month in [1, 2, 3]:
        result = monthly_retraining_workflow(db, 2023, month)
        results.append(result)
    
    # Display summary
    print("\n" + "=" * 100)
    print("MONTHLY RETRAINING SUMMARY")
    print("=" * 100)
    
    results_df = pd.DataFrame(results)
    
    print(f"\n{'Month':<6} | {'Train Size':>12} | {'Test Size':>10} | {'R²':>8} | {'MAE':>12} | {'Reserve':>15}")
    print("-" * 100)
    
    for _, row in results_df.iterrows():
        print(f"{row['month']:>6} | {row['train_size']:>12,} | {row['test_size']:>10,} | "
              f"{row['r2']:>7.4f} | ${row['mae']:>11,.0f} | ${row['total_reserve']:>14,.0f}")
    
    print("\n" + "=" * 100)
    print("PRODUCTION WORKFLOW COMPLETE")
    print("=" * 100)
    
    print(f"\n💡 IN REAL PRODUCTION:")
    print(f"   1. This script runs automatically on the 1st of each month (cron job/scheduler)")
    print(f"   2. Database connection uses real credentials (PostgreSQL/MySQL/MongoDB)")
    print(f"   3. Results are stored in database tables for reporting")
    print(f"   4. Alerts are sent if predictions deviate significantly")
    print(f"   5. Model version is tracked for auditing")
    print(f"   6. API endpoints expose predictions to frontend applications")
    
    print(f"\n📊 DATABASE TABLES:")
    print(f"   • claims_table: Stores all claim records (updated daily)")
    print(f"   • predictions_table: Stores monthly predictions")
    print(f"   • reserves_table: Stores reserve allocations")
    print(f"   • model_metadata: Stores model versions and performance")
    print(f"   • audit_log: Tracks all model retraining events")
    
    print(f"\n🔄 AUTOMATION:")
    print(f"   • Scheduled job: Runs on 1st of each month at 2:00 AM")
    print(f"   • Reads: Previous month's actual claims from database")
    print(f"   • Trains: Model with all historical data")
    print(f"   • Predicts: Remaining months of current year")
    print(f"   • Saves: Results back to database")
    print(f"   • Notifies: Stakeholders via email/dashboard")
