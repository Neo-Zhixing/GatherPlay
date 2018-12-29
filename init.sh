echo 'Fetch firebase credentials...'
firebase setup:web > node_modules/firebaseInit.js

echo 'Fetch firebase function credentials...'
firebase functions:config:get > functions/.runtimeconfig.json
export GOOGLE_APPLICATION_CREDENTIALS="$(cd "${0%/*}/.."; pwd)/functions/service_account.json"
