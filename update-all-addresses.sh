#!/bin/bash

# New contract addresses
HOSPITAL_REGISTRY="0xCD3776b193DBF88c95507E41dF57D0dF111c4849"
USER_REGISTRY="0x2470620B608091Fe4F633932a08F415ef070D6BC"
POLICY_CONTRACT="0x9e4340EFD699e5DEF0b98aE10beC57a5E9F9F98D"
CLAIMS_CONTRACT="0xF5f43041F1686543aA20A94391187D8214C3e292"

echo "Updating contract addresses in all frontend files..."

# Update App.js
sed -i "s/const USER_REGISTRY_ADDRESS.*=.*/const USER_REGISTRY_ADDRESS     = \"$USER_REGISTRY\";/" client/src/App.js
sed -i "s/const HOSPITAL_REGISTRY_ADDRESS.*=.*/const HOSPITAL_REGISTRY_ADDRESS = \"$HOSPITAL_REGISTRY\";/" client/src/App.js

# Update all component files
find client/src/components -name "*.js" -type f -exec sed -i "s/0x[a-fA-F0-9]\{40\}/$CLAIMS_CONTRACT/g" {} \;

echo "Done! Contract addresses updated."
echo ""
echo "New addresses:"
echo "HospitalRegistry: $HOSPITAL_REGISTRY"
echo "UserRegistry:     $USER_REGISTRY"
echo "PolicyContract:   $POLICY_CONTRACT"
echo "ClaimsContract:   $CLAIMS_CONTRACT"
