# ViennaMobile

Light Jiggy based application for offline reading RSS messages downloaded by desktop Vienna. Now we are working on seamless synchronization with it ;)


## Installing

Setup of ViennaMobile can be done in tree steps.

For the first step you have to install [Jiggy runtime](http://jiggyapp.com/get_jiggy) from Installer package or Cydia one.

The second, is to install ViennaMobile.app itself. It's easy, just download [the archive](http://viennamobile.googlecode.com/files/ViennaMobile.tgz) and uncompress it into your Application directory.

The third step is in copying your Vienna database from mac to iphone. Just run your favorite ftp/sftp client and connect to iphone. It could be good if you are logging in under user 'mobile', so you will not have to change owner for copied files. So copy files from **/Users/YOUR/Library/Application Support/Vienna/** on your mac to **/var/mobile/Media/ViennaMobile/** on you iphone.

That's all. But if you had copied all files under root you will have to do one additional step. To allow ViennaMobile read/write access on **/var/mobile/Media/ViennaMobile/messages.db** change owner of this file to 'moblie'. It can be done by typing this commant in your iphone shell: chown -R mobile:mobile /var/mobile/Media/ViennaMobile/, or you can set world access to messages.db by changing permissions to 666: chown 666 /var/mobile/Media/ViennaMobile/messages.db.


P.S. For now we can't sync files to or from iphone in other way then manual.

## Screenshots

![feeds](https://raw.githubusercontent.com/kung-fu-tzu/viennamobile/master/feeds.png)
![messages](https://raw.githubusercontent.com/kung-fu-tzu/viennamobile/master/messages.png)
![preview](https://raw.githubusercontent.com/kung-fu-tzu/viennamobile/master/preview.png)
![safari](https://raw.githubusercontent.com/kung-fu-tzu/viennamobile/master/safari.png)
![webview](https://raw.githubusercontent.com/kung-fu-tzu/viennamobile/master/webview.png)
