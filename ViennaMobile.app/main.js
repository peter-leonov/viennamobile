debug(1)

Plugins.load("UIKit")
Plugins.load("SQLite")
include('js/ORM.js')
include('js/common.js')

var prefs = { show_images: true }

// connecting DB
var rootDir = Application.userHomeDirectory + '/Media/ViennaMobile'
var dbh = new SQLite(rootDir + '/messages.db')

ORM.dbh = dbh
var RSSFolder = ORM.newClass('rss_folders', {folder_id: {primary_key: true, type: Number}, home_page: {type: String}})
var Folder = ORM.newClass('folders', {folder_id: {primary_key: true, type: Number}, parent_id: {type: Number}, unread_count: {type: Number}, foldername: {type: String}})
var Message = ORM.newClass('messages', {message_id: {primary_key: true, type: String}, folder_id: {type: Number}, text: {type: String, readonly: true}, title: {type: String, readonly: true}, read_flag: {type: Number}})

// terminate()

// define window objec
var defaultView = new UIWindow(UIHardware.fullScreenApplicationContentRect)
// setting up window
defaultView.setHidden(false)
defaultView.orderFront()
defaultView.makeKey()
defaultView.backgroundColor = [0.5, 0.5, 0.5, 1]
defaultView.views = {}

Application.setStatusBarMode(0, 1, 0, 5)
Application.uuid = 'ru.programica.peter.ViennaMobile'

function makeDefaultPng () { Images.createApplicationDefaultPNG().saveToFile('/tmp/UpdatedSnapshots/' + Application.uuid + '-Default.jpg') }
function onUnload () {  }

function onLoad ()
{
	// and tview
	var tview = defaultView.tview = new UITransitionView(defaultView.bounds)
	defaultView.setContentView(tview)
	
	buildFeedsView()
	buildMessagesView()
	buildPostView()
	buildPageView()
	
	renderFeeds()
	
	defaultView.tview.transition(0, defaultView.views.feeds)
	// makeDefaultPng()
}


function buildFeedsView ()
{
	// preparing feeds list
	var list = defaultView.views.feeds = new UISectionList(defaultView.tview.bounds)
	with (list.table)
	{
		addTableColumn(new UITableColumn("column", "column", list.bounds[2]))
		rowHeight = 48
		separatorStyle = 1
	}


	// list.setAllowsScrollIndicators(true)
	list.setNonIndexedTitlesShownLast(true)
	list.setShouldHideHeaderInShortLists(false)
	list.setIndexVisible(false)

	list.onGetNumberOfSections = function(t) { return t.sections.length }
	list.onGetSectionTitle = function(t, s) { return t.sections[s].name }
	list.onGetSectionRow = function(t, s) { return t.sections[s].rowNumber }

	list.onGetNumberOfRows = function(t) { return t.cells.length }
	list.onGetCell = function(t, c, r) { return t.cells[r] }
	// list.onCanSelectRow = function(l, c, r) { return true }
	list.onRowSelected = function(t, r) { renderMessages(t.cells[r].folder); defaultView.tview.transition(1, defaultView.views.messages) }
	// list.onShowDisclosureForRow = function (t, r) { 	return true }
	
	list.table.setCanHandleSwipes(true)
	list.table.onSwipe = function (dir)
	{
		if (dir == 8)
			defaultView.tview.transition(2, defaultView.views.messages)
	}
}

function renderFeeds ()
{
	if (prefs.show_images)
	{
		// preparing feeds images
		var imageByFolderId = {}
		var rss = RSSFolder.find(1)
		for (var i = 0; i < rss.length; i++)
		{
			var match = rss[i].home_page.match(/http:\/\/([\w\-\.]+)/)
			if (match)
			{
				var name = match[1].replace(/\./g, '_')
				var fn = rootDir + '/Images/' + name + '.tiff'
				var image = Images.imageWithContentsOfFile(fn)
				if (image)
				{
					if (image.size[0] != 16)
					{
						image.resize(16, 16)
						image.saveToFile(fn)
					}
					imageByFolderId[rss[i].folder_id] = image
				}
				else
					1//log(name)
			}
		}
	}
	
	var folders = Folder.find('type = 3 OR type = 4') // db.get('SELECT * FROM folders WHERE type = 3 OR type = 4')
	folders = folders.sort(function (a, b) { return b.parent_id - a.parent_id })
	
	var list = defaultView.views.feeds
	var cells = list.cells = []
	var sections = list.sections = []
	var foldersById = {}
	var foldersByParentId = {}
	
	for (var i = 0; i < folders.length; i++)
		foldersById[folders[i].folder_id] = folders[i]
	
	for (var i = 0; i < folders.length; i++)
		if (foldersById[folders[i].parent_id])
			foldersById[folders[i].parent_id].isParent = true

	var lastParentId = -1
	for (var i = 0; i < folders.length; i++)
	{
		var folder = folders[i]
	
		if (!folder.isParent)
		{
			var cell = new UIImageAndTextTableCell()
			cell.title = folder.foldername + ' ('+folder.unread_count+')'
			if (imageByFolderId)
				cell.setImage(imageByFolderId[folder.folder_id])
			cell.folder = folder
			cells.push(cell)
		
			if (folder.parent_id != lastParentId)
			{
				lastParentId = folder.parent_id
				sections.push({name: foldersById[folder.parent_id] ? foldersById[folder.parent_id].foldername : "???", rowNumber: i})
			}
		}
	}
	
	list.reloadData()
}

function buildMessagesView ()
{
	// preparing messages list
	var table = defaultView.views.messages = new UITable(defaultView.tview.bounds)
	table.cells = []
	table.addTableColumn(new UITableColumn("column", "column", table.bounds[2]))
	table.rowHeight = 48
	table.separatorStyle = 1
	
	table.onGetNumberOfRows = function(t) { return t.cells.length }
	table.onGetCell = function(t, c, r) { return t.cells[r] }
	table.onRowSelected = function(t, r)
	{
		var cell = t.cells[r]
		var message = cell.message
		message.read_flag = 1
		message.save()
		cell.setDisclosureStyle(0)
		renderPost(message)
		defaultView.tview.transition(1, defaultView.views.post)
	}
	table.onShowDisclosureForRow = function (t, r) { return true }
	
	table.setCanHandleSwipes(true)
	table.onSwipe = function (dir)
	{
		if (dir == 8)
			defaultView.tview.transition(2, defaultView.views.feeds)
		else if (dir == 4)
			defaultView.tview.transition(1, defaultView.views.post)
	}
}


function renderMessages (feed)
{
	var table = defaultView.views.messages
	
	if (table.feed == feed)
		return
	
	var messages = feed.messages = Message.find('folder_id = ' + feed.folder_id + ' ORDER BY date DESC')
	var cells = table.cells = []
	for (var i = 0; i < messages.length; i++)
	{
		var message = messages[i]
		var cell = new UIImageAndTextTableCell()
		cell.title = message.title
		cell.message = message
		cells[i] = cell
		if (!message.read_flag)
			cell.setDisclosureStyle(1)
	}
	
	// table.clearAllData()
	table.reloadData()
	table.highlightRow(0)
	table.scrollRowToVisible(0)
	
	table.feed = feed
}

function buildPostView (post)
{
	var tv = defaultView.views.post = new UITextView(defaultView.tview.bounds)
	tv.editable = false
	tv.textSize = '17'
	
	tv.setCanHandleSwipes(true)
	tv.onSwipe = function (dir)
	{
		if (dir == 8)
			defaultView.tview.transition(2, defaultView.views.messages)
	}
}

function renderPost (post)
{
	var tv = defaultView.views.post
	tv.post = post
	var html = post.text.replace(/<\/?(img|link|script).*?>/, '')
	tv.HTML = '<div style="width:300px;overflow:hidden;padding:0;margin:0">' + html + '</div>'
	tv.setContentsPosition = 0
	tv.onTap = function (tc, fc)
	{
		if (tc == 2)
		 	renderPage(post.link),
		 	defaultView.tview.transition(1, defaultView.views.page)
	}
}

function buildPageView ()
{
	var bounds = defaultView.tview.bounds
	var v = defaultView.views.page = new UIView([0, 48, bounds[2], bounds[3] - 48])
	
	var wv = new WebView(bounds)
	v.addSubview(wv)
	v.wv = wv
	
	var nb = new UINavigationBar([0, 0, bounds[2], 48])
	nb.showButtonsWithLeftTitle('Back', 'Safari', false)
	v.addSubview(nb)
	v.nb = nb
	
}

function renderPage (url)
{
	var v = defaultView.views.page
	v.wv.loadURL(url)
	v.nb.onButtonClicked = function (br, bt)
	{
		if (bt)
			defaultView.tview.transition(2, defaultView.views.post)
		else
			openURL(url, true)
	}
}


