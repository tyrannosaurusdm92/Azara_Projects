"""Inspect outputs from test-writerhelper.cjs. Requires fontTools."""
from pathlib import Path
from io import BytesIO
import base64
import re
import sys
from fontTools.ttLib import TTFont

outputs=Path(sys.argv[1])
original=TTFont(Path(__file__).resolve().parents[1]/'assets/ttf/Azaaraan-Modern.ttf')
font=TTFont(outputs/'edited-modern.ttf',checkChecksums=2)
assert len(font.getGlyphOrder())==len(original.getGlyphOrder())+1
assert font.getGlyphOrder()[:len(original.getGlyphOrder())]==original.getGlyphOrder()
for codepoint,name in original.getBestCmap().items():
    assert original.getGlyphID(name)==font.getGlyphID(font.getBestCmap()[codepoint]),hex(codepoint)
for name in ['GDEF','GSUB','GPOS']:
    assert font.getTableData(name)==original.getTableData(name),name
assert font['name'].getDebugName(1)=='WriterHelper QA Modern'
assert font['name'].getDebugName(16)=='WriterHelper QA Modern'
assert font['name'].getDebugName(13)=='Test license'
assert -45 in font['kern'].kernTables[0].kernTable.values()
glyph=font['glyf'][font.getBestCmap()[0xE101]]
assert glyph.numberOfContours==2,'PNG outline lost its hole or kept the white background'
assert font['OS/2'].usWinAscent>=max(g.yMax for g in font['glyf'].glyphs.values() if hasattr(g,'yMax'))
proto=TTFont(outputs/'new-proto.ttf',checkChecksums=2)
assert proto['glyf'][proto.getBestCmap()[0xE102]].numberOfContours>0
for name in ['edited-modern.ttf','new-proto.ttf']:
    raw=(outputs/name).read_bytes();raw+=bytes((-len(raw))%4)
    checksum=sum(int.from_bytes(raw[i:i+4],'big') for i in range(0,len(raw),4))&0xFFFFFFFF
    assert checksum==0xB1B0AFBA,(name,hex(checksum))
html=(outputs/'manuscript.html').read_text()
embedded=re.findall(r'data:font/ttf;base64,([A-Za-z0-9+/=]+)',html)
assert embedded,'Manuscript HTML has no portable font'
assert any(TTFont(BytesIO(base64.b64decode(value)))['name'].getDebugName(1)=='WriterHelper QA Modern' for value in embedded)
print('PASS TTF checksums, glyph order, Khmer layout, metadata, kerning, PNG counters, Proto font and embedded manuscript fonts')
