# This is done s.t. we can e2e test based on 
cd ../../../compiler/
yarn sur generate ts-client\
  -f ../e2e/typescript-quackpad/def/quackpad.sur\
  -o ../e2e/typescript-quackpad/client/sur-genfiles
cd ../e2e/typescript-quackpad/client/
