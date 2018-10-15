import urllib

mcc, mnc, cid, lac = 250, 99, 49973, 13955
mcc, mnc, cid, lac = 250, 99, 49983, 13952

a = '000E00000000000000000000000000001B0000000000000000000000030000'
b = hex(cid)[2:].zfill(8) + hex(lac)[2:].zfill(8)
c = hex(mnc)[2:].zfill(8) + hex(mcc)[2:].zfill(8)
d = 'FFFFFFFF00000000'

string = (a + b + c + d).decode('hex')
print a + b + c + d

try:
    data = urllib.urlopen('http://www.google.com/glm/mmap', string)
    r = data.read().encode('hex')
    print r[14:22], int(r[14:22], 16)
    print r[22:30], int(r[22:30], 16)

    if len(r) > 14:
        print float(int(r[14:22],16))/1000000, float(int(r[22:30],16))/1000000
    else:
        print 'no data in google'
except:
    print 'connect error'
