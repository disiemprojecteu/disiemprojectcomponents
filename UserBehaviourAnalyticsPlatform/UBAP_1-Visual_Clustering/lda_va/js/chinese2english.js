/*
* @Author: wakouboy
* @Date:   2017-03-28 15:39:59
* @Last Modified by:   wakouboy
* @Last Modified time: 2017-03-29 16:56:09
*/

'use strict';

window.Chinese2English = {
    '纱布': 'Gauze',
    '脑残': 'Moron',
    '报道': 'Report',
    '莆田': 'Putian',
    '山东': 'Shandong',
    '媒体': 'Media',
    '医生': 'Doctor',
    '不要脸': 'Shameless',
    '事实': 'Fact',
    '五毛': 'Troll',
    '节目': 'Show',
    '忠于': 'Loyal to',
    '生活': 'Life',
    '严惩': 'Punish',
    '医院': 'Hospital',
    '回复': 'Reply',
    '中国': 'China',
    '央视': 'CCTV',
    '问题': 'Issue',
    '医患': 'Doctors and patients',
    '需要': 'Need',
    '医疗': 'Medical care',
    '患者': 'Patients',
    '监督': 'Suprevise',
    '新闻': 'News',
    '初心': 'Original intention',
    '广告': 'Advertisement',
    '造谣': 'Rumors',
    '十年': 'Ten years',
    '评论': 'Comments',
    '泰山': 'Mount Tai',
    '恶心': 'Nausea',
    '敢当': 'Undertake',
    '启事': 'Notice',
    '寻物': 'Seeking',
    '道歉': 'Apologize',
    '山东人': 'Shandong native',
    '医闹': 'Medical disturbance',
    '阿速': 'Mr. Su',
    '调查': 'Investigate',
    '电视台': 'TV station',
    '扒皮': 'Flay',
    '浪费': 'Waste',
    '分钟': 'Minute',
    '一分钟': 'One minute',
    '事件': 'Events',
    '产妇': 'Puerpera',
    '资源': 'Resources',
    '子宫': 'Uterus',
    '女人': 'Women',
    '孩子': 'Baby',
    '事故': 'Accident',
    '可悲': 'lamentable',
    '可怜': 'pitiable',
    '填塞': 'Packing',
    '签字': 'Sign',
    '黑笔': 'Black Pen',
    '涂改': 'Alter',

    // jingzhengnan
    '朝鲜': 'North Korea',
    '马来西亚': 'Malaysia', // 
    '金正': 'Kim Jong-nam',
    '金正恩': 'Kim Jeong-eun',
    '中国' : 'China',
    '三胖': 'Kim Jeong-eun', 
    '国家': 'Country',
    '暗杀': 'Assassination',
    '机场': 'Airport',
    '警方': 'Police',
    '马来': 'Malaysia', //
    '回复': 'Reply',
    '使馆': 'Embassy',
    '遇害': 'Killed',
    '韩国': 'Korea',
    '大马': 'Malaysia',
    '大使': 'Ambassador',
    '死者': 'The dead',
    'VX' : 'VX',
    '勇闯': 'Brave',
    '神经': 'Nerve',
    '毒剂': 'Toxic',
    '化学武器': 'Chemical weapon',
    '死亡': 'Death',
    '问题': 'Issue',
    '美国': 'America',
    '核武': 'Nuclear weapon',
    '世界': 'World',
    '媒体': 'Media',
    '外交': 'International Relations',
    '回去': 'Return',
    '证据': 'Evidence',
    '稀土': 'Rare earth',
    '发布会': 'Release conference',
    '免签': 'Visa-free',
    '北京': 'Beijing',
    '流氓': 'Rogue',
    '公民': 'Citizen',
    '人质': 'Hostage',
    '朝鲜人': 'North Koreans',
    '禁止': 'Forbidden',
    '绑架': 'Kidnap',
    '视频': 'Video',
    '儿子': 'Son',
    '保护': 'Protect',
    '安全': 'Security',
    '金家': 'Kim dynasty',
    '韩松': 'Han Song',
    '承认': 'Admit',
    '巫师': 'Wizard',
    '事件': 'Event',
    '做法': 'Practice',
    '萨德': 'THAAD',
    '遗体': 'Remains',
    '行动': 'Action',
    '男子': 'Man',
    '川普': 'Trump',
    'DNA': 'DNA'
}
window.showEnglish = false
$("#buttonEn").on('click', function () {
    window.showEnglish = !window.showEnglish
    mapGlyph.updateText(window.showEnglish)
    timeViz.updateText(window.showEnglish)
    mapView.redraw()

    if(window.showEnglish) {
        $("#buttonEn").addClass('active')
    }
    else {
        $('#buttonEn').removeClass('active')
    }
})