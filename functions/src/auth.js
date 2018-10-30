const functions = require('firebase-functions')
const admin = require('firebase-admin')

const user_functions = functions.auth.user()

exports.create = user_functions.onCreate(user => {

})
exports.delete = user_functions.onDelete(user => {

})
