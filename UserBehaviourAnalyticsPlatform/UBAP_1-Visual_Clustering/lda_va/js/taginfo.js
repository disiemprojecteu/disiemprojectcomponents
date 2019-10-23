/*
 * @Author: wakouboy
 * @Date:   2017-03-27 01:14:51
 * @Last Modified by:   wakouboy
 * @Last Modified time: 2017-03-28 22:54:43
 */

'use strict';

function createTag(cx, cy, color, name, nameKey, text) {
    var cx = cx
    var cy = cy
    var div = '<div  class ="snapshotView"' + 'id=snapshotView' + nameKey + ' style="background:white;border: 1px solid ' + color + '; border-radius: 3px; width:140px">\
        <div id="head" style="background-color: ' + color + '">' + name +
        '<div class="btn-group btn-group-xs" role="group" aria-label="..." style="float: right;">\
                    <span id=span' + nameKey + ' class="snapremove glyphicon glyphicon-remove-circle" aria-hidden="true"></span>\
            </div>\
        </div>\
        <div style="margin: 2px; font-size: 10px; background-color: white" >' + text + '</div>\
    </div>'

    var topViewDiv = $('#topView')
    topViewDiv.append(div)
    var extent = mapView.extent
    var ex = (+extent['width']) / 2
    var ey = (+extent['height']) / 2
    var rx = ex + cx // 实际位置
    var ry = ey + cy
    var divx = rx + 50
    var divy = ry + 50
    var headH = 20,
        headW = 60
    var height = $('#snapshotView' + nameKey).height(),
        width = $('#snapshotView' + nameKey).width()
    $('#snapshotView' + nameKey).css({ left: divx, top: divy, position: 'absolute' })
    $('#snapshotView' + nameKey).draggable({
        drag: function() {
            var Y = $('#snapshotView' + nameKey).position().top - ex
            var X = $('#snapshotView' + nameKey).position().left - ey
            var x2 = X + width / 2
            var y2 = Y + height / 2
            var rx2, ry2
            if (window.transform != null) {
                rx2 = (x2 - window.transform.x) / window.transform.k
                ry2 = (y2 - window.transform.y) / window.transform.k
            } else {
                rx2 = x2
                ry2 = y2
            }
            d3.select('#line' + nameKey)
                .attr('x1', cx)
                .attr('y1', cy)
                .attr('x2', rx2)
                .attr('y2', ry2)
        },
    })
    $('.snapremove').click(function(argument) {
        $(this).parent().parent().parent().remove()
        $('#' + $(this).attr('id')).remove()
        $('#line' + nameKey).remove()

    })
    var x2 = divx + width / 2 - ex,
        y2 = divy + height / 2 - ey,
        rx2, ry2;
    if (window.transform != null) {
        rx2 = (x2 - window.transform.x) / window.transform.k
        ry2 = (y2 - window.transform.y) / window.transform.k
    } else {
        rx2 = x2
        ry2 = y2
    }
    d3.select('g.framework').append('line')
        .attr('id', 'line' + nameKey)
        .attr('class', 'linkline')
        .attr('x1', cx)
        .attr('y1', cy)
        .attr('x2', rx2)
        .attr('y2', ry2)
        .style('stroke', color)
        .style('stroke-width', 1)
        .attr('z-index', 1000)

}
