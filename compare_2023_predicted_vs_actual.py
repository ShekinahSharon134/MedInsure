import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error
import warnings
import os
warnings.filterwarnings('ignore')

print("=" * 100)
print("2023 PREDICTED vs ACTUAL - MONTH BY MONTH COMPARISON")
print("Shows how accurate the initial prediction was for each month")
print("=" * 100)

base_path = os.path.dirname(__file__)

# ============================================================================
# LOAD DATA
# ============================================================================
print("\n📂 Loading dataset...")
df_full = pd.read_csv(os.path.join(base_path, 'ENHANCED_CLAIMS_2018_2023_FOR_DEMO.csv'), low_memory=False)
df_full = df_full[df_full['claim_date'].between(1, 12)].copy()
df_full['month'] = df_full['claim_date'].astype(int)
print(f"✅ Loaded: {len(df_full):,} rows")

# ============================================================================
# FEATURE ENGINEERING
# ============================================================================
print("\n⚙️  Creating features...")

def create_features(df):
    df = df.copy()
    
    # LAG FEATURES
    patient_stats = df.groupby('patient_id').agg({
        'claim_amount_requested': ['count', 'mean'],
        'claim_amount_approved': ['mean'],
        'comorbidity_count': 'max'
    }).reset_index()
    patient_stats.columns = ['patient_id', 'patient_claim_count', 'patient_avg_requested',
                             'patient_avg_approved', 'patient_max_comorbidity']
    df = df.merge(patient_stats, on='patient_id', how='left')
    
    df['lag_1_requested'] = df.groupby('patient_id')['claim_amount_requested'].shift(1)
    df['lag_1_approved'] = df.groupby('patient_id')['claim_amount_approved'].shift(1)
    df['rolling_3_avg_requested'] = df.groupby('patient_id')['claim_amount_requested'].transform(
        lambda x: x.rolling(window=3, min_periods=1).mean()
    )
    df['rolling_3_avg_approved'] = df.groupby('patient_id')['claim_amount_approved'].transform(
        lambda x: x.rolling(window=3, min_periods=1).mean()
    )
    df['patient_approval_rate'] = df['patient_avg_approved'] / (df['patient_avg_requested'] + 1)
    
    # SEASONAL FEATURES
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    df['quarter'] = ((df['month'] - 1) // 3) + 1
    df['is_q1'] = (df['quarter'] == 1).astype(int)
    df['is_q4'] = (df['quarter'] == 4).astype(int)
    df['year_normalized'] = (df['year'] - 2018) / 5
    df['seasonal_avg_by_type'] = df.groupby(['month', 'claim_type'])['claim_amount_approved'].transform('mean')
    
    # COMORBIDITY FEATURES
    df['comorbidity_score'] = df['comorbidity_count'] * df['condition_priority']
    df['has_multiple_comorbidities'] = (df['comorbidity_count'] >= 3).astype(int)
    df['comorbidity_x_age'] = df['comorbidity_count'] * df['patient_age']
    df['chronic_complex'] = ((df['condition_priority'] <= 2) & (df['comorbidity_count'] >= 2)).astype(int)
    
    # REGIONAL FEATURES
    df['regional_avg_cost'] = df.groupby('region')['claim_amount_approved'].transform('mean')
    df['cost_vs_regional_avg'] = df['claim_amount_requested'] / (df['regional_avg_cost'] + 1)
    df['region_x_claim_type'] = df['region'].astype(str) + '_' + df['claim_type']
    region_claim_encoder = LabelEncoder()
    df['region_claim_encoded'] = region_claim_encoder.fit_transform(df['region_x_claim_type'])
    high_cost_regions = df.groupby('region')['claim_amount_approved'].mean().nlargest(2).index
    df['is_high_cost_region'] = df['region'].isin(high_cost_regions).astype(int)
    
    # PLAN FEATURES
    df['plan_x_claim_type'] = df['plan_category'].astype(str) + '_' + df['claim_type']
    plan_claim_encoder = LabelEncoder()
    df['plan_claim_encoded'] = plan_claim_encoder.fit_transform(df['plan_x_claim_type'])
    df['high_ded_high_prem'] = ((df['deductible_category'] >= 3) & (df['premium_level'] >= 3)).astype(int)
    df['is_employer_plan'] = (df['plan_category'] == 1).astype(int)
    df['is_hmo'] = (df['plan_type_hmo'] == 1).astype(int)
    df['plan_generosity'] = (5 - df['deductible_category']) + (5 - df['premium_level'])
    
    # CORE FEATURES
    df['amount_ratio'] = df['claim_amount_approved'] / (df['claim_amount_requested'] + 1)
    df['log_requested'] = np.log1p(df['claim_amount_requested'])
    df['age_squared'] = df['patient_age'] ** 2
    df['age_group'] = pd.cut(df['patient_age'], bins=[0, 18, 35, 50, 65, 100], labels=[0, 1, 2, 3, 4])
    df['age_group'] = df['age_group'].cat.codes.replace(-1, 2)
    
    # Encode categorical
    gender_map = {'Male': 1, 'Female': 2, 'Unknown': 0}
    df['gender'] = df['patient_gender'].map(gender_map).fillna(0)
    
    region_map = {'Northeast': 1, 'Midwest': 2, 'South': 3, 'West': 4, 'Unknown': 0}
    df['region_encoded'] = df['region'].map(region_map).fillna(0)
    
    le_claim = LabelEncoder()
    df['claim_type_encoded'] = le_claim.fit_transform(df['claim_type'].astype(str))
    
    icd_freq = df['icd_category'].value_counts(normalize=True).to_dict()
    df['icd_category_freq'] = df['icd_category'].map(icd_freq).fillna(0)
    
    # Fill missing
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().sum() > 0:
            df[col].fillna(df[col].median(), inplace=True)
    
    return df

feature_columns = [
    'claim_amount_requested', 'log_requested', 'amount_ratio',
    'patient_age', 'age_squared', 'age_group', 'gender',
    'comorbidity_count', 'condition_priority',
    'comorbidity_score', 'has_multiple_comorbidities', 
    'comorbidity_x_age', 'chronic_complex',
    'education_years', 'poverty_category',
    'region_encoded', 'regional_avg_cost', 'cost_vs_regional_avg',
    'region_claim_encoded', 'is_high_cost_region',
    'month', 'month_sin', 'month_cos', 'quarter', 
    'is_q1', 'is_q4', 'year_normalized', 'seasonal_avg_by_type',
    'claim_type_encoded', 'icd_category_freq',
    'plan_category', 'premium_level', 'deductible_category',
    'plan_type_hmo', 'is_employer_plan', 'is_hmo',
    'plan_generosity', 'high_ded_high_prem',
    'plan_claim_encoded',
    'patient_claim_count', 'patient_avg_requested', 'patient_avg_approved',
    'patient_approval_rate', 'lag_1_requested', 'lag_1_approved',
    'rolling_3_avg_requested', 'rolling_3_avg_approved'
]

# ============================================================================
# TRAIN MODEL ON 2018-2022 (BASELINE)
# ============================================================================
print("\n🤖 Training baseline model on 2018-2022...")

train_data = df_full[df_full['year'] <= 2022].copy()
test_data = df_full[df_full['year'] == 2023].copy()

train_data = create_features(train_data)
test_data = create_features(test_data)

X_train = train_data[feature_columns]
y_train = train_data['claim_amount_approved']
X_test = test_data[feature_columns]
y_test = test_data['claim_amount_approved']

# Remove invalid
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
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.3,
    reg_alpha=0.5,
    reg_lambda=1.5,
    random_state=42,
    n_jobs=-1,
    tree_method='hist'
)

model.fit(X_train_scaled, y_train, verbose=False)

# Predict
y_pred = model.predict(X_test_scaled)
y_pred = np.maximum(y_pred, 0)

test_data['predicted_approved'] = y_pred

print(f"✅ Model trained!")
print(f"   Training: {len(X_train):,} claims (2018-2022)")
print(f"   Testing: {len(X_test):,} claims (2023)")

# ============================================================================
# MONTH BY MONTH COMPARISON
# ============================================================================
print("\n📊 Calculating month-by-month comparison...")

monthly = test_data.groupby('month').agg(
    actual_claims=('claim_amount_approved', 'sum'),
    predicted_claims=('predicted_approved', 'sum'),
    claim_count=('claim_amount_approved', 'count'),
    avg_actual=('claim_amount_approved', 'mean'),
    avg_predicted=('predicted_approved', 'mean')
).reset_index().sort_values('month')

# Calculate differences
monthly['difference'] = monthly['predicted_claims'] - monthly['actual_claims']
monthly['difference_pct'] = (monthly['difference'] / monthly['actual_claims']) * 100
monthly['abs_error_pct'] = abs(monthly['difference_pct'])

# Add month names
month_names = {1:'Jan', 2:'Feb', 3:'Mar', 4:'Apr', 5:'May', 6:'Jun',
               7:'Jul', 8:'Aug', 9:'Sep', 10:'Oct', 11:'Nov', 12:'Dec'}
monthly['month_name'] = monthly['month'].map(month_names)

# ============================================================================
# DISPLAY RESULTS
# ============================================================================
print("\n" + "=" * 120)
print("2023 PREDICTED vs ACTUAL - MONTH BY MONTH")
print("Based on model trained on 2018-2022 data")
print("=" * 120)

print(f"\n{'Month':<6} | {'Claims':>7} | {'Actual':>13} | {'Predicted':>13} | {'Difference':>13} | {'Diff %':>8} | {'Status':>10}")
print("-" * 120)

for _, row in monthly.iterrows():
    status = '✅ Good' if abs(row['difference_pct']) < 5 else '⚠️  Fair' if abs(row['difference_pct']) < 10 else '❌ Poor'
    sign = '+' if row['difference'] > 0 else ''
    
    print(f"{row['month_name']:<6} | {row['claim_count']:>7,.0f} | "
          f"${row['actual_claims']:>12,.0f} | ${row['predicted_claims']:>12,.0f} | "
          f"{sign}${row['difference']:>11,.0f} | {sign}{row['difference_pct']:>6.2f}% | {status}")

print("-" * 120)

# Totals
total_actual = monthly['actual_claims'].sum()
total_predicted = monthly['predicted_claims'].sum()
total_difference = total_predicted - total_actual
total_diff_pct = (total_difference / total_actual) * 100

print(f"{'TOTAL':<6} | {monthly['claim_count'].sum():>7,.0f} | "
      f"${total_actual:>12,.0f} | ${total_predicted:>12,.0f} | "
      f"{'+' if total_difference > 0 else ''}${total_difference:>11,.0f} | "
      f"{'+' if total_diff_pct > 0 else ''}{total_diff_pct:>6.2f}% | "
      f"{'✅ Good' if abs(total_diff_pct) < 5 else '⚠️  Fair'}")

print("=" * 120)

# ============================================================================
# SUMMARY STATISTICS
# ============================================================================
print(f"\n{'='*100}")
print("SUMMARY STATISTICS")
print(f"{'='*100}")

print(f"\n📊 OVERALL ACCURACY:")
print(f"   Total Actual:     ${total_actual:>15,.0f}")
print(f"   Total Predicted:  ${total_predicted:>15,.0f}")
print(f"   Total Difference: ${total_difference:>15,.0f} ({total_diff_pct:+.2f}%)")

print(f"\n📈 MONTHLY STATISTICS:")
print(f"   Best month:       {monthly.loc[monthly['abs_error_pct'].idxmin(), 'month_name']} ({monthly['abs_error_pct'].min():.2f}% error)")
print(f"   Worst month:      {monthly.loc[monthly['abs_error_pct'].idxmax(), 'month_name']} ({monthly['abs_error_pct'].max():.2f}% error)")
print(f"   Average error:    {monthly['abs_error_pct'].mean():.2f}%")
print(f"   Median error:     {monthly['abs_error_pct'].median():.2f}%")

over_predicted = (monthly['difference'] > 0).sum()
under_predicted = (monthly['difference'] < 0).sum()

print(f"\n📉 PREDICTION BIAS:")
print(f"   Over-predicted:   {over_predicted} months")
print(f"   Under-predicted:  {under_predicted} months")
print(f"   Bias direction:   {'Over-estimating' if total_difference > 0 else 'Under-estimating'}")

good_months = (monthly['abs_error_pct'] < 5).sum()
fair_months = ((monthly['abs_error_pct'] >= 5) & (monthly['abs_error_pct'] < 10)).sum()
poor_months = (monthly['abs_error_pct'] >= 10).sum()

print(f"\n✅ ACCURACY BREAKDOWN:")
print(f"   Good (<5% error):   {good_months} months")
print(f"   Fair (5-10% error): {fair_months} months")
print(f"   Poor (>10% error):  {poor_months} months")

# ============================================================================
# SAVE RESULTS
# ============================================================================
output_file = os.path.join(base_path, '2023_PREDICTED_VS_ACTUAL_COMPARISON.csv')
monthly.to_csv(output_file, index=False)

print(f"\n💾 Results saved: 2023_PREDICTED_VS_ACTUAL_COMPARISON.csv")

print(f"\n{'='*100}")
print("🎉 COMPARISON COMPLETE!")
print(f"{'='*100}")

print(f"\n💡 KEY TAKEAWAY:")
if abs(total_diff_pct) < 5:
    print(f"   ✅ Excellent! Model predicted 2023 within {abs(total_diff_pct):.2f}% of actual")
elif abs(total_diff_pct) < 10:
    print(f"   ⚠️  Good! Model predicted 2023 within {abs(total_diff_pct):.2f}% of actual")
else:
    print(f"   ❌ Model was off by {abs(total_diff_pct):.2f}% - needs improvement")

print(f"\n   This shows how accurate your initial 2023 forecast was!")
print(f"   Based on historical data (2018-2022) only.")
