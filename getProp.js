const _getProp = (object, path) => {
  if(!object) return;
  else if(typeof object !== 'object') return;
  else if(path.length === 1) return object[path[0]];

  const [key, ...restOfPath] = path;
  return _getProp(object[key], restOfPath);

};

export default (object, path) => Array.isArray(path) ? _getProp(object, path) : _getProp(object, path.split('.'));