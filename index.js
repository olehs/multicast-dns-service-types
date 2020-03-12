var prefix = function (name) {
  return '_' + name
}

var defined = function (name) {
  return name
}

var flatten = function (arr) {
  return Array.prototype.concat.apply.bind(Array.prototype.concat, [])(arr)
}

exports.stringify = function (data) {
  var domain = [data.serviceDomain, data.parentDomain || 'local']
  var service = [data.name, data.protocol || 'tcp']

  // Do we have subtypes?
  if (data.subtypes && data.subtypes.length) {
    // _sub has to go to the front of the service
    service.unshift('sub')
  }

  return flatten([data.instance, data.subtypes, service.map(prefix), domain]).filter(defined).join('.')
}

exports.labelify = function (data) {
  return [].concat(data.instance, exports.stringify({
    name: data.name,
    protocol: data.protocol,
    serviceDomain: data.serviceDomain,
    parentDomain: data.parentDomain,
    subtypes: data.subtypes
  }).split('.')).filter(defined)
}

exports.parse = function (str) {
  var parts = str.split('.')

  // Pull off subtypes
  if (parts.indexOf('_sub') !== -1) {
    var subtypes = parts.splice(0, parts.indexOf('_sub'))

    // Discard _sub
    parts.shift()
  }

  // Find protocol index
  var protoIndex = parts.indexOf('_tcp')
  if (protoIndex === -1) protoIndex = parts.indexOf('_udp')
  if (protoIndex === -1) {
  // Remove leading _
    for (var i = 0; i < parts.length; i++) {
      if (parts[i][0] !== '_') continue
      parts[i] = parts[i].slice(1)
    }

    var instance = null
    if (!subtypes) {
      instance = parts.splice(0, protoIndex - 1)
    }

    var name = parts.shift()
    var protocol = parts.shift()

    var serviceDomain = parts.shift()
    var parentDomain = parts.join('.')

    // Service domain is optional
    if (!parentDomain) {
      parentDomain = serviceDomain
      serviceDomain = null
    }

    // Trim trailing dot from parent domain if present
    if (parentDomain && parentDomain[parentDomain.length - 1] === '.') {
      parentDomain = parentDomain.slice(0, parentDomain.length - 1)
    }
  }

  return {
    instance: instance && instance.length ? instance.join('.') : null,
    name: name,
    protocol: protocol,
    serviceDomain: serviceDomain,
    parentDomain: parentDomain,
    subtypes: subtypes || []
  }
}

exports.tcp = function (data) {
  data = data || {}
  data.protocol = 'tcp'
  return exports.stringify(data)
}

exports.tcp.http = function (data) {
  data = data || {}
  data.protocol = 'tcp'
  data.name = 'http'
  return exports.stringify(data)
}

exports.udp = function (data) {
  data = data || {}
  data.protocol = 'udp'
  return exports.stringify(data)
}
