window = self = this

function setTimeout (f, t)
{
	var tm = new Timer(t / 1000)
	tm.onTimer = function () { tm.stop(), f() }
	tm.start()
	return tm
}

function clearTimeout (tm) { tm.stop() }

function setInterval (f, t)
{
	var tm = new Timer(t / 1000)
	tm.onTimer = f
	tm.start()
	return tm
}

function clearInterval (tm) { tm.stop() }