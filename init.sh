firebase functions:config:get > functions/.runtimeconfig.json
export GOOGLE_APPLICATION_CREDENTIALS="$(cd "${0%/*}/.."; pwd)/functions/service_account.json"
