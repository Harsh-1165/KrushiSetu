/**
 * Pagination Helper Utility
 * Handles pagination logic for database queries
 */

/**
 * Default pagination values
 */
const DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
}

/**
 * Parse pagination parameters from query string
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed pagination parameters
 */
const parsePaginationParams = (query) => {
  let page = Number.parseInt(query.page, 10) || DEFAULTS.page
  let limit = Number.parseInt(query.limit, 10) || DEFAULTS.limit

  // Ensure positive values
  page = Math.max(1, page)
  limit = Math.max(1, Math.min(limit, DEFAULTS.maxLimit))

  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * Calculate pagination metadata
 * @param {number} total - Total number of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  }
}

/**
 * Paginate MongoDB query
 * @param {Object} Model - Mongoose model
 * @param {Object} query - MongoDB query object
 * @param {Object} options - Pagination and query options
 * @returns {Object} Paginated results with metadata
 */
const paginateQuery = async (Model, query = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 }, select = "", populate = "", lean = true } = options

  const skip = (page - 1) * limit

  // Execute count and find in parallel
  const [total, documents] = await Promise.all([
    Model.countDocuments(query),
    Model.find(query).select(select).populate(populate).sort(sort).skip(skip).limit(limit).lean(lean),
  ])

  const pagination = getPaginationMeta(total, page, limit)

  return {
    data: documents,
    pagination,
  }
}

/**
 * Paginate MongoDB aggregation
 * @param {Object} Model - Mongoose model
 * @param {Array} pipeline - Aggregation pipeline
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated results with metadata
 */
const paginateAggregate = async (Model, pipeline = [], options = {}) => {
  const { page = 1, limit = 10 } = options
  const skip = (page - 1) * limit

  // Add facet stage for pagination
  const paginatedPipeline = [
    ...pipeline,
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]

  const [result] = await Model.aggregate(paginatedPipeline)

  const total = result.metadata[0]?.total || 0
  const pagination = getPaginationMeta(total, page, limit)

  return {
    data: result.data,
    pagination,
  }
}

/**
 * Parse sort parameters from query string
 * @param {string} sortString - Sort string (e.g., "-createdAt,name")
 * @param {Array} allowedFields - Fields allowed for sorting
 * @returns {Object} MongoDB sort object
 */
const parseSortParams = (sortString, allowedFields = []) => {
  if (!sortString) return { createdAt: -1 }

  const sort = {}
  const fields = sortString.split(",")

  for (const field of fields) {
    const isDescending = field.startsWith("-")
    const fieldName = isDescending ? field.substring(1) : field

    // Only allow specified fields or all if not restricted
    if (allowedFields.length === 0 || allowedFields.includes(fieldName)) {
      sort[fieldName] = isDescending ? -1 : 1
    }
  }

  return Object.keys(sort).length > 0 ? sort : { createdAt: -1 }
}

/**
 * Parse select/projection parameters
 * @param {string} selectString - Comma-separated field names
 * @param {Array} excludeFields - Fields to always exclude
 * @returns {string} MongoDB select string
 */
const parseSelectParams = (selectString, excludeFields = ["password", "__v"]) => {
  let select = excludeFields.map((f) => `-${f}`).join(" ")

  if (selectString) {
    const fields = selectString.split(",").filter((f) => !excludeFields.includes(f))
    if (fields.length > 0) {
      select = fields.join(" ")
    }
  }

  return select
}

/**
 * Build filter query from request query params
 * @param {Object} queryParams - Request query parameters
 * @param {Object} fieldMappings - Field name mappings and types
 * @returns {Object} MongoDB query object
 */
const buildFilterQuery = (queryParams, fieldMappings = {}) => {
  const query = {}

  for (const [param, config] of Object.entries(fieldMappings)) {
    const value = queryParams[param]
    if (value === undefined || value === "") continue

    const { field = param, type = "string", operator = "eq" } = typeof config === "string" ? { field: config } : config

    switch (type) {
      case "string":
        if (operator === "regex") {
          query[field] = { $regex: value, $options: "i" }
        } else {
          query[field] = value
        }
        break

      case "number":
        const numValue = Number.parseFloat(value)
        if (!isNaN(numValue)) {
          if (operator === "gte") query[field] = { ...query[field], $gte: numValue }
          else if (operator === "lte") query[field] = { ...query[field], $lte: numValue }
          else if (operator === "gt") query[field] = { ...query[field], $gt: numValue }
          else if (operator === "lt") query[field] = { ...query[field], $lt: numValue }
          else query[field] = numValue
        }
        break

      case "boolean":
        query[field] = value === "true" || value === "1"
        break

      case "date":
        const dateValue = new Date(value)
        if (!isNaN(dateValue.getTime())) {
          if (operator === "gte") query[field] = { ...query[field], $gte: dateValue }
          else if (operator === "lte") query[field] = { ...query[field], $lte: dateValue }
          else query[field] = dateValue
        }
        break

      case "array":
        query[field] = { $in: value.split(",") }
        break

      case "objectId":
        if (/^[0-9a-fA-F]{24}$/.test(value)) {
          query[field] = value
        }
        break
    }
  }

  return query
}

/**
 * Cursor-based pagination for large datasets
 * @param {Object} Model - Mongoose model
 * @param {Object} query - MongoDB query
 * @param {Object} options - Pagination options
 * @returns {Object} Paginated results with cursor
 */
const cursorPaginate = async (Model, query = {}, options = {}) => {
  const { limit = 10, cursor = null, sort = { _id: -1 }, select = "", populate = "" } = options

  // Build cursor query
  const cursorQuery = { ...query }
  if (cursor) {
    const sortField = Object.keys(sort)[0]
    const sortOrder = sort[sortField]
    cursorQuery[sortField] = sortOrder === -1 ? { $lt: cursor } : { $gt: cursor }
  }

  const documents = await Model.find(cursorQuery)
    .select(select)
    .populate(populate)
    .sort(sort)
    .limit(limit + 1)
    .lean()

  const hasNextPage = documents.length > limit
  if (hasNextPage) documents.pop()

  const sortField = Object.keys(sort)[0]
  const nextCursor = hasNextPage && documents.length > 0 ? documents[documents.length - 1][sortField] : null

  return {
    data: documents,
    pagination: {
      hasNextPage,
      nextCursor,
      count: documents.length,
    },
  }
}

module.exports = {
  DEFAULTS,
  parsePaginationParams,
  getPaginationMeta,
  paginateQuery,
  paginateAggregate,
  parseSortParams,
  parseSelectParams,
  buildFilterQuery,
  cursorPaginate,
}
