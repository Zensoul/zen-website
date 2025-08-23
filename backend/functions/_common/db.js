// functions/_common/db.js
const AWS = require('aws-sdk')

const ddb = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true })

module.exports = {
  ddb,
  tables: {
    USERS: process.env.USERS_TABLE,
    ASSESSMENTS: process.env.ASSESSMENTS_TABLE || 'ZenAssessments',
    COUNSELLORS: process.env.COUNSELLORS_TABLE || 'ZenCounsellors',
    APPOINTMENTS: process.env.APPOINTMENTS_TABLE || 'ZenAppointments',
    CONSULTATIONS: process.env.CONSULTATIONS_TABLE || 'ZenConsultations',
  },
}
