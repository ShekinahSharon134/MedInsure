# New Contract Addresses after deployment
$HOSPITAL_REGISTRY = "0xC71b1e9E69a3DB757C0412B91506C7aC246e17c9"
$USER_REGISTRY = "0xB6FA05De5D3f7f67e1A4cCc9C4AD79B032A3ccC4"
$POLICY_CONTRACT = "0xf72DC72bABC49a0cF93e073F9A98BB7a1EFc76e6"
$CLAIMS_CONTRACT = "0x8AE7c69290fDbBf611993f41A4F7E370937EB13F"

# Old addresses to replace
$OLD_HOSPITAL = "0x43591125B03396Ec69e38f2E5987e9743bECcD64"
$OLD_USER = "0x939EF26e3A2AC7Ed06B6128ff494dB27D50FfEfc"
$OLD_POLICY = "0x24aBBEBc4b0B9D4e7139c97A54Fe4ED93cE7AB4C"
$OLD_CLAIMS = "0x22377398284FdecfC2a40c653AFe5c7d5f741085"

Write-Host "Updating contract addresses in all files..." -ForegroundColor Yellow

# Get all JS files in client/src
$files = Get-ChildItem -Path "client/src" -Filter "*.js" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace addresses
    $content = $content -replace $OLD_HOSPITAL, $HOSPITAL_REGISTRY
    $content = $content -replace $OLD_USER, $USER_REGISTRY
    $content = $content -replace $OLD_POLICY, $POLICY_CONTRACT
    $content = $content -replace $OLD_CLAIMS, $CLAIMS_CONTRACT
    
    # Write back
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "✅ All contract addresses updated!" -ForegroundColor Green
Write-Host ""
Write-Host "New addresses:" -ForegroundColor Cyan
Write-Host "HospitalRegistry: $HOSPITAL_REGISTRY"
Write-Host "UserRegistry:     $USER_REGISTRY"
Write-Host "PolicyContract:   $POLICY_CONTRACT"
Write-Host "ClaimsContract:   $CLAIMS_CONTRACT"
