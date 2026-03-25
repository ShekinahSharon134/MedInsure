"""
ROLLING FORECAST - MONTHLY AGGREGATED MAPE (Same calculation as Baseline)
==========================================================================
For each retraining cycle, calculate MAPE as average of individual monthly errors
This makes it directly comparable to baseline MAPE of 2.58%

Key difference from previous:
  OLD: error_pct = |sum_predicted - sum_actual| / sum_actual  (total period error)
  NEW: mape = avg(|month_pred - month_act| / month_act)       (monthly aggregated)
"""
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import warnings, os
warnings.filterwarnings('ignore')

base_path = os.path.dirname(__file__)

# Load data
df_full = pd.read_csv(os.path.join(base_path, 'ENHANCED_CLAIMS_2018_2023_FOR_DEMO.csv'), low_memory=False)
df_full = df_full[df_full['claim_date'].between(1, 12)].copy()
df_full['month'] = df_full['claim_date'].astype(int)

def create_features(df):
    df = df.copy()
    ps = df.groupby('patient_id').agg({
        'claim_amount_requested': ['count','mean'],
        'claim_amount_approved': ['mean'],
        'comorbidity_count': 'max'
    }).reset_index()
    ps.columns = ['patient_id','patient_claim_count','patient_avg_requested',
                  'patient_avg_approved','patient_max_comorbidity']
    df = df.merge(ps, on='patient_id', how='left')
    df['lag_1_requested'] = df.groupby('patient_id')['claim_amount_requested'].shift(1)
    df['lag_1_approved']  = df.groupby('patient_id')['claim_amount_approved'].shift(1)
    df['rolling_3_avg_requested'] = df.groupby('patient_id')['claim_amount_requested'].transform(lambda x: x.rolling(3,min_periods=1).mean())
    df['rolling_3_avg_approved']  = df.groupby('patient_id')['claim_amount_approved'].transform(lambda x: x.rolling(3,min_periods=1).mean())
    df['patient_approval_rate'] = df['patient_avg_approved'] / (df['patient_avg_requested'] + 1)
    df['month_sin'] = np.sin(2*np.pi*df['month']/12)
    df['month_cos'] = np.cos(2*np.pi*df['month']/12)
    df['quarter']   = ((df['month']-1)//3)+1
    df['is_q1'] = (df['quarter']==1).astype(int)
    df['is_q4'] = (df['quarter']==4).astype(int)
    df['year_normalized'] = (df['year']-2018)/5
    df['seasonal_avg_by_type'] = df.groupby(['month','claim_type'])['claim_amount_approved'].transform('mean')
    df['comorbidity_score'] = df['comorbidity_count'] * df['condition_priority']
    df['has_multiple_comorbidities'] = (df['comorbidity_count']>=3).astype(int)
    df['comorbidity_x_age'] = df['comorbidity_count'] * df['patient_age']
    df['chronic_complex'] = ((df['condition_priority']<=2)&(df['comorbidity_count']>=2)).astype(int)
    df['regional_avg_cost'] = df.groupby('region')['claim_amount_approved'].transform('mean')
    df['cost_vs_regional_avg'] = df['claim_amount_requested'] / (df['regional_avg_cost']+1)
    df['region_x_claim_type'] = df['region'].astype(str)+'_'+df['claim_type']
    df['region_claim_encoded'] = LabelEncoder().fit_transform(df['region_x_claim_type'])
    hcr = df.groupby('region')['claim_amount_approved'].mean().nlargest(2).index
    df['is_high_cost_region'] = df['region'].isin(hcr).astype(int)
    df['plan_x_claim_type'] = df['plan_category'].astype(str)+'_'+df['claim_type']
    df['plan_claim_encoded'] = LabelEncoder().fit_transform(df['plan_x_claim_type'])
    df['high_ded_high_prem'] = ((df['deductible_category']>=3)&(df['premium_level']>=3)).astype(int)
    df['is_employer_plan'] = (df['plan_category']==1).astype(int)
    df['is_hmo'] = (df['plan_type_hmo']==1).astype(int)
    df['plan_generosity'] = (5-df['deductible_category'])+(5-df['premium_level'])
    df['amount_ratio'] = df['claim_amount_approved']/(df['claim_amount_requested']+1)
    df['log_requested'] = np.log1p(df['claim_amount_requested'])
    df['age_squared'] = df['patient_age']**2
    df['age_group'] = pd.cut(df['patient_age'],bins=[0,18,35,50,65,100],labels=[0,1,2,3,4])
    df['age_group'] = df['age_group'].cat.codes.replace(-1,2)
    df['gender'] = df['patient_gender'].map({'Male':1,'Female':2,'Unknown':0}).fillna(0)
    df['region_encoded'] = df['region'].map({'Northeast':1,'Midwest':2,'South':3,'West':4,'Unknown':0}).fillna(0)
    df['claim_type_encoded'] = LabelEncoder().fit_transform(df['claim_type'].astype(str))
    icd_freq = df['icd_category'].value_counts(normalize=True).to_dict()
    df['icd_category_freq'] = df['icd_category'].map(icd_freq).fillna(0)
    for col in df.select_dtypes(include=[np.number]).columns:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
    return df

FEATURES = [
    'claim_amount_requested','log_requested','amount_ratio',
    'patient_age','age_squared','age_group','gender',
    'comorbidity_count','condition_priority','comorbidity_score',
    'has_multiple_comorbidities','comorbidity_x_age','chronic_complex',
    'education_years','poverty_category',
    'region_encoded','regional_avg_cost','cost_vs_regional_avg',
    'region_claim_encoded','is_high_cost_region',
    'month','month_sin','month_cos','quarter','is_q1','is_q4',
    'year_normalized','seasonal_avg_by_type',
    'claim_type_encoded','icd_category_freq',
    'plan_category','premium_level','deductible_category',
    'plan_type_hmo','is_employer_plan','is_hmo',
    'plan_generosity','high_ded_high_prem','plan_claim_encoded',
    'patient_claim_count','patient_avg_requested','patient_avg_approved',
    'patient_approval_rate','lag_1_requested','lag_1_approved',
    'rolling_3_avg_requested','rolling_3_avg_approved'
]

MN = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
      7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'}

print("="*80)
print("ROLLING FORECAST - MONTHLY AGGREGATED MAPE")
print("Same calculation method as Baseline (avg of individual monthly errors)")
print("="*80)

results = []

for m in range(1, 13):
    mn = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][m-1]

    # Training data
    if m == 1:
        tr = df_full[df_full['year'] <= 2022].copy()
    else:
        tr = df_full[(df_full['year']<=2022)|
                     ((df_full['year']==2023)&(df_full['month']<m))].copy()

    # Test data = remaining months of 2023
    te = df_full[(df_full['year']==2023)&(df_full['month']>=m)].copy()
    if len(te) == 0: continue

    tr = create_features(tr)
    te = create_features(te)

    Xtr = tr[FEATURES]; ytr = tr['claim_amount_approved']
    Xte = te[FEATURES]; yte = te['claim_amount_approved']

    vtr = (ytr.notna())&(ytr>=0)&(ytr<1e9)
    vte = (yte.notna())&(yte>=0)&(yte<1e9)
    Xtr,ytr = Xtr[vtr],ytr[vtr]
    Xte,yte = Xte[vte],yte[vte]
    te = te[vte]

    scaler = StandardScaler()
    Xtr_s = scaler.fit_transform(Xtr)
    Xte_s = scaler.transform(Xte)

    model = XGBRegressor(n_estimators=300,max_depth=6,learning_rate=0.03,
                         subsample=0.8,colsample_bytree=0.8,min_child_weight=3,
                         gamma=0.3,reg_alpha=0.5,reg_lambda=1.5,
                         random_state=42,n_jobs=-1,tree_method='hist')
    model.fit(Xtr_s, ytr, verbose=False)
    ypred = np.maximum(model.predict(Xte_s), 0)
    te['predicted'] = ypred

    # ── MONTHLY AGGREGATED MAPE (same as baseline) ──
    monthly = te.groupby('month').agg(
        actual=('claim_amount_approved','sum'),
        predicted=('predicted','sum')
    ).reset_index()
    monthly['month_error'] = abs(monthly['actual']-monthly['predicted'])/monthly['actual']*100

    # This is the KEY metric - average of individual monthly errors
    monthly_mape = monthly['month_error'].mean()

    # Claim-level metrics
    mae  = mean_absolute_error(yte.values, ypred)
    rmse = np.sqrt(mean_squared_error(yte.values, ypred))

    results.append({
        'Retrain_Month': mn,
        'Train_Size': len(Xtr),
        'Months_Predicted': 13-m,
        'MAE': round(mae,2),
        'RMSE': round(rmse,2),
        'Monthly_MAPE_%': round(monthly_mape,2),
        'Monthly_Breakdown': monthly[['month','actual','predicted','month_error']].to_dict('records')
    })

    print(f"\n{mn} retraining → predicting {13-m} months:")
    print(f"  {'Month':<6} {'Actual':>13} {'Predicted':>13} {'Error%':>8}")
    for _, r in monthly.iterrows():
        print(f"  {MN[r['month']]:<6} ${r['actual']:>12,.0f} ${r['predicted']:>12,.0f} {r['month_error']:>7.2f}%")
    print(f"  {'─'*50}")
    print(f"  Monthly MAPE = {monthly_mape:.2f}%  |  MAE = ${mae:,.2f}  |  RMSE = ${rmse:,.2f}")

# ============================================================================
# FINAL COMPARISON TABLE
# ============================================================================
print("\n" + "="*80)
print("FINAL COMPARISON: BASELINE vs ROLLING (Same MAPE Calculation)")
print("="*80)

# Baseline monthly MAPE (already known)
baseline_monthly = [2.91,1.66,1.54,0.23,0.39,2.12,3.60,0.85,5.30,3.82,3.28,5.20]
baseline_mape = np.mean(baseline_monthly)

avg_rolling_mape = np.mean([r['Monthly_MAPE_%'] for r in results])
avg_rolling_mae  = np.mean([r['MAE'] for r in results])
avg_rolling_rmse = np.mean([r['RMSE'] for r in results])

print(f"\n{'Retrain':<10} {'Months Pred':>12} {'Monthly MAPE':>14} {'MAE':>10} {'RMSE':>10}")
print("-"*62)
print(f"{'BASELINE':<10} {'12':>12} {baseline_mape:>13.2f}% {'$22.27':>10} {'$78.11':>10}")
for r in results:
    print(f"{r['Retrain_Month']:<10} {r['Months_Predicted']:>12} {r['Monthly_MAPE_%']:>13.2f}% ${r['MAE']:>9,.2f} ${r['RMSE']:>9,.2f}")

print("-"*62)
print(f"{'ROLLING AVG':<10} {'─':>12} {avg_rolling_mape:>13.2f}% ${avg_rolling_mae:>9,.2f} ${avg_rolling_rmse:>9,.2f}")

print(f"""
{'='*80}
FINAL METRICS FOR PAPER (Both using Monthly Aggregated MAPE)
{'='*80}

  Metric                  Baseline      Rolling Avg    Industry Std
  ─────────────────────────────────────────────────────────────────
  R² (Claim-level)        73.56%        N/A            60-70%
  R² (Monthly Agg.)       98.37%        N/A*           95-99%
  MAE (per claim)         $22.27        ${avg_rolling_mae:,.2f}         $30-50
  RMSE (per claim)        $78.11        ${avg_rolling_rmse:,.2f}        $80-120
  MAPE (monthly agg.)     {baseline_mape:.2f}%         {avg_rolling_mape:.2f}%          5-10%

  * R² not reported for rolling: test set shrinks each month
  * MAE, RMSE: claim-level | MAPE: monthly aggregated
{'='*80}
""")

out_df = pd.DataFrame([{k:v for k,v in r.items() if k!='Monthly_Breakdown'} for r in results])
out_df.to_csv(os.path.join(base_path,'ROLLING_MONTHLY_MAPE_CORRECT.csv'), index=False)
print("✅ Saved: ROLLING_MONTHLY_MAPE_CORRECT.csv")
