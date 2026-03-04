#!/bin/bash

# New Contract Addresses after deployment
HOSPITAL_REGISTRY="0xC71b1e9E69a3DB757C0412B91506C7aC246e17c9"
USER_REGISTRY="0xB6FA05De5D3f7f67e1A4cCc9C4AD79B032A3ccC4"
POLICY_CONTRACT="0xf72DC72bABC49a0cF93e073F9A98BB7a1EFc76e6"
CLAIMS_CONTRACT="0x8AE7c69290fDbBf611993f41A4F7E370937EB13F"

# Old addresses to replace
OLD_HOSPITAL="0x43591125B03396Ec69e38f2E5987e9743bECcD64"
OLD_USER="0x939EF26e3A2AC7Ed06B6128ff494dB27D50FfEfc"
OLD_POLICY="0x24aBBEBc4b0B9D4e7139c97A54Fe4ED93cE7AB4C"
OLD_CLAIMS="0x22377398284FdecfC2a40c653AFe5c7d5f741085"

echo "Updating contract addresses in all files..."

# Update HospitalRegistry address
find client/src -name "*.js" -type f -exec sed -i "s/$OLD_HOSPITAL/$HOSPITAL_REGISTRY/g" {} +

# Update UserRegistry address
find client/src -name "*.js" -type f -exec sed -i "s/$OLD_USER/$USER_REGISTRY/g" {} +

# Update PolicyContract address
find client/src -name "*.js" -type f -exec sed -i "s/$OLD_POLICY/$POLICY_CONTRACT/g" {} +

# Update ClaimsContract address
find client/src -name "*.js" -type f -exec sed -i "s/$OLD_CLAIMS/$CLAIMS_CONTRACT/g" {} +

echo "✅ All contract addresses updated!"
echo ""
echo "New addresses:"
echo "HospitalRegistry: $HOSPITAL_REGISTRY"
echo "UserRegistry:     $USER_REGISTRY"
echo "PolicyContract:   $POLICY_CONTRACT"
echo "ClaimsContract:   $CLAIMS_CONTRACT"
