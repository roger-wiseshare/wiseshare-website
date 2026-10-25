# 官網建置腳本：把 pages/ 裡每頁的主內容，套上共用的頁首、頁尾，輸出到儲存庫根目錄。
# 用法：python3 _build/build.py
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / '_build' / 'pages'

DESC = '智享數位資通陪台灣中小企業與傳產做經營轉型、B2B 銷售轉型、數位轉型與接班傳承，用實戰培訓、老闆一對一與進公司陪跑，把策略變成可以持續賺錢的制度。'

# 檔名：(頁面標題, 主選單中對應的項目)
META = {
    'index': ('智享數位資通｜企業的經營夥伴‧轉型的陪跑教練', None),
    'services': ('轉型領域', 'services'),
    'services-management': ('企業經營轉型', 'services'),
    'services-sales': ('B2B 銷售轉型', 'services'),
    'services-digital': ('企業數位轉型', 'services'),
    'services-succession': ('接班傳承專案', 'services'),
    'industry': ('傳產轉型專區', 'services'),
    'methodology': ('服務模式', 'methodology'),
    'checkup': ('3 分鐘企業轉型健檢', 'checkup'),
    'about': ('關於我們', 'about'),
    'team': ('顧問團隊', 'about'),
    'contact': ('預約免費轉型診斷', 'contact'),
    'privacy': ('隱私權聲明', None),
}

NAV = [
    ('services', '轉型領域 ▾', [
        ('services.html', '總覽與服務矩陣'),
        ('services-management.html', '企業經營轉型'),
        ('services-sales.html', 'B2B 銷售轉型'),
        ('services-digital.html', '企業數位轉型'),
        ('services-succession.html', '接班傳承專案'),
        ('industry.html', '傳產轉型專區'),
    ]),
    ('methodology', '服務模式', None),
    ('checkup', '企業健檢', None),
    ('about', '關於我們 ▾', [
        ('about.html', '關於我們'),
        ('team.html', '顧問團隊'),
    ]),
]


def header(current):
    items = []
    for key, label, sub in NAV:
        cur = ' aria-current="page"' if key == current else ''
        href = f'{key}.html'
        if sub:
            links = '\n'.join(f'        <a href="{h}">{t}</a>' for h, t in sub)
            items.append(f'    <div class="dd"><a href="{href}"{cur}>{label}</a>\n      <div class="dd-menu">\n{links}\n      </div>\n    </div>')
        else:
            items.append(f'    <a href="{href}"{cur}>{label}</a>')
    cta_cur = ' aria-current="page"' if current == 'contact' else ''
    items.append(f'    <a class="nav-cta" href="contact.html"{cta_cur}>預約免費診斷</a>')
    nav = '\n'.join(items)
    return f'''<header class="site"><div class="wrap">
  <a class="brand" href="index.html" aria-label="回首頁"><span class="logo-slot">Logo<br>待提供</span><b>智享數位資通</b></a>
  <nav class="main" aria-label="主選單">
{nav}
  </nav>
</div></header>'''


FOOTER = '''<footer class="site"><div class="wrap">
  <div><div class="slogan">陪企業把轉型做出成果</div><div>© 智享數位資通｜rogerwang@wiseshare.com.tw</div></div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end"><a href="checkup.html">3 分鐘企業健檢</a><a href="privacy.html">隱私權聲明</a><span>Facebook／LinkedIn <span class="todo">【有就放】</span></span></div>
</div></footer>'''


def page(name):
    title, current = META[name]
    full = title if name == 'index' else f'{title}｜智享數位資通'
    body = (PAGES / f'{name}.html').read_text(encoding='utf-8').rstrip('\n')
    float_btn = '' if name in ('contact', 'checkup') else '<a class="btn primary float-cta" href="contact.html">預約免費診斷</a>\n'
    script = '<script src="checkup.js" defer></script>\n' if name == 'checkup' else ''
    return f'''<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{full}</title>
<meta name="description" content="{DESC}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap">
<link rel="stylesheet" href="style.css">
{script}</head>
<body>
{header(current)}
<main>
{body}
</main>
{FOOTER}
{float_btn}</body>
</html>
'''


for name in META:
    (ROOT / f'{name}.html').write_text(page(name), encoding='utf-8')
print('built', len(META), 'pages')
