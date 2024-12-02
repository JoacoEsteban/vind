export const NODE_ENV = process.env.NODE_ENV
export const ENV_PROD = NODE_ENV === 'production'
export const LOGS_ENABLED = !ENV_PROD //  TODO add specific debug env for production debugging
export const SERIALIZATION_JSON_INDENT = ENV_PROD ? 0 : 2
export const SERIALIZATION_MINIFY = true
