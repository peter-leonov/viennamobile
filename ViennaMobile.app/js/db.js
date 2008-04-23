SQLite.prototype.get = function (query)
{
	var arr = this.select(query)
	if (!arr)
		return []
	var cols = arr.shift()
	// log(cols)
	var res = []
	
	for (var i = 0; i < arr.length; i++)
	{
		var hash = res[i] = {}
		var row = arr[i]
		for (var j = 0; j < cols.length; j++)
		{
			hash[cols[j]] = row[j]
		}
		arr[i]
	}
	
	return res
}


// // simple bench
// var begin = new Date()
// for (var i = 0; i < 100000; i++);
// log(new Date() - begin)