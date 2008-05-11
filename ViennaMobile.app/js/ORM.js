if (this.ORM)
	throw new Error('Global var "ORM" is already defined');

this.ORM =
{
	version: '0.01',
	dbh: null,
	newClass: function (table, fields, dbh, func)
	{
		var klass = func || function () {  }
		for (var k in this.Class)
			klass[k] = this.Class[k]
		klass.dbh = dbh || this.dbh
		klass.table = table
		klass.fields = fields
		klass.prototype = this.Base
		klass.prototype._klass = klass
		
		var fields_names = klass.fields_names = []
		var fields_names_rw = klass.fields_names_rw = []
		var fields_names_ro = klass.fields_names_ro = []
		for (var k in fields)
		{
			fields[k].name = k
			fields_names.push(k)
			if (fields[k].primary_key)
				klass.primary_key = fields[k]
			
			if (fields[k].readonly)
				fields_names_ro.push(k)
			else
				fields_names_rw.push(k)
		}
		
		return klass
	}
}

ORM.Class =
{
	dbh: null,
	fields: null,
	load_query: null,
	primary_key: 'id',
	
	load: function (id)
	{
		var data = this.dbh.orm_load(this, id)
		if (!data)
			return null
		
		var obj = new this()
		var flds = this.fields
		for (var k in flds)
		{
			var f = flds[k]
			obj[f.name] = f.type(data[f.name])
		}
		
		return obj
	},
	
	find: function (where)
	{
		var all = this.dbh.orm_find(this, where)
		if (!all)
			return []
		
		var flds = this.fields
		var res = []
		for (var i = 0; i < all.length; i++)
		{
			var obj = new this()
			for (var k in flds)
			{
				var f = flds[k]
				obj[f.name] = f.type(all[i][f.name])
			}
		
			res[i] = obj
		}
		return res
	},
	
	create: function ()
	{
		log('create function is not implemented')
	},
	
	delete: function ()
	{
		log('delete function is not implemented')
	}
}

ORM.Base =
{
	_klass: null,
	
	save: function ()
	{
		this._klass.dbh.orm_save(this._klass, this)
	}
}




SQLite.prototype.bake_query = function (query, args)
{
	var parts = query.split('?')
	var q = []
	for (var i = 0; i < parts.length - 1; i++)
	{
		var val = args[i]
		val = typeof val == 'number' ? String(val) : ('"' + String(val).replace('"', '""') + '"')
		
		q[i*2] = parts[i]
		q[i*2 + 1] = val
	}
	q[i*2] = parts[i]
	log(q.join(''))
	return q.join('')
}


SQLite.prototype.do = function (query, args)
{
	
	var res = this.execute(this.bake_query(query, args))
	if (!res)
		throw new Error('SQLite: error in SQL statement "' + query + '"')
	
	return res
}

SQLite.prototype.selectall = function (query, args)
{
	
	var res = this.select(this.bake_query(query, args))
	if (!res)
		throw new Error('SQLite: error in SQL statement "' + query + '"')
	
	return res
}

SQLite.prototype.orm_find = function (klass, where)
{
	var query = klass.__SQLite_find_query
	if (!query)
	{
		if (!klass.primary_key)
			throw new Error('No primary_key specified for "' + klass + '"')
		
		query = klass.__SQLite_load_query = 'SELECT ' + klass.fields_names.join(', ') + ' FROM ' + klass.table + ' WHERE ' + where
	}
	
	var all = this.selectall(query)
	all.shift()
	
	var res = []
	for (var i = 0; i < all.length; i++)
	{
		var row = all[i]
		var data = {}
		for (var j = 0; j < klass.fields_names.length; j++)
			data[klass.fields_names[j]] = row[j]
		res[i] = data
	}
	return res
}

SQLite.prototype.orm_load = function (klass, id)
{
	var query = klass.__SQLite_load_query
	if (!query)
	{
		if (!klass.primary_key)
			throw new Error('No primary_key specified for "' + klass + '"')
		
		query = klass.__SQLite_load_query = 'SELECT ' + klass.fields_names.join(', ') + ' FROM ' + klass.table + ' WHERE ' + klass.primary_key.name + ' = ?'
	}
	
	var row = this.selectall(query, [id])[1]
	if (!row)
		return null
	
	var data = {}
	for (var i = 0; i < klass.fields_names.length; i++)
		data[klass.fields_names[i]] = row[i]
	
	return data
}

SQLite.prototype.orm_save = function (klass, data)
{
	var query = klass.__SQLite_save_query
	var fields = klass.fields_names_rw
	if (!query)
	{
		if (!klass.primary_key)
			throw new Error('No primary_key specified for "' + klass + '"')
		
		query = klass.__SQLite_save_query = 'UPDATE ' + klass.table + ' SET ' + fields.join(' = ?, ') + ' = ? WHERE ' + klass.primary_key.name + ' = ?'
	}
	
	var args = []
	for (var i = 0; i < fields.length; i++)
		args[i] = data[fields[i]]
	args.push(data[klass.primary_key.name])
	
	return this.do(query, args)
}

