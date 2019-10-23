var MapGlyph = function(divId) {

    var self = this
    var padding = { 'left': 45, 'top': 10, 'bottom': 20, 'right': 15 }
    self.padding = padding
    self.W = $('#glyph').width()
    self.H = $('#glyph').height()
    var svg = d3.select('#' + divId).append('svg').attr('width', self.W).attr('height', self.H).attr('id', 'glyphSvg')
    self.svg = svg
    self.merge = true
    self.R = 3
    self.topRate = 1
    self.textHeight = 12
        // $('#buttonRemove').on('click', function() {
        //     $('#glyphView').css('display', 'none')
        // })
        // $('#glyphView').draggable()
        // $("#glyphView").resizable({
        //         ghost: true,
        //         stop: function(event, ui) {
        //             console.log([$(this).outerWidth(), $(this).outerHeight()])
        //             self.W = $(this).width()
        //             self.H = $(this).height() - 22
        //             $('#glyphSvg').width(self.W)
        //             $('#glyphSvg').height(self.H)
        //             self.redraw()
        //         }
        //     })
        // $("#buttonMerge").on('click', self.mergeTrees)
    document.getElementById("buttonMerge").onclick = mergeTrees

    function mergeTrees() {
        console.log(self.merge)
        if (!self.merge) {
            self.mergeTrees(self)
            self.merge = true
            $("#buttonMerge").addClass('active')
        } else {
            self.splitNodes(self)
            self.merge = false
            $("#buttonMerge").removeClass('active')
        }
    }

}

MapGlyph.prototype.show = function(data) {
    var self = this
    var treeDatas = []
    var treeDatas2 = []
    self.start = new Date()
        // console.log(data)
    for (var i in data) {
        if (data[i].parent != null && data[i].parent != undefined) {
            var rt = getColor(data[i].parent)
            rt.children = []
            rt.dep = 0
            var mid = getColor(data[i])
            mid.dep = 1
            if (data[i].children != null && data[i].children != undefined && data[i].children.length > 0) {
                mid.children = []
                for (var j in data[i].children) {
                    var child = getColor(data[i].children[j])
                    child.dep = 2
                    mid.children.push(child)
                }
            }
            rt.children.push(mid)
            if (self.notNull(mid.children)) {
                mid.childNum = mid.children.length
                mid.children.sort(function(a, b) {
                    if (a.key == false) return 1
                    return a.keyword.localeCompare(b.keyword)
                })
            }
            rt.childNum = 1
            treeDatas.push(rt)
        } else {
            var mid = getColor(data[i])
            mid.dep = 1
            if (data[i].children != null || data[i].children != undefined && data[i].children.length > 0) {
                mid.children = []
                for (var j in data[i].children) {
                    var child = getColor(data[i].children[j])
                    child.dep = 2
                    mid.children.push(child)
                }

            }
            if (self.notNull(mid.children)) {
                mid.childNum = mid.children.length
                mid.children.sort(function(a, b) {
                    if (a.key == false) return 1
                    return a.keyword.localeCompare(b.keyword)
                })
            }
            treeDatas2.push(mid)
        }

    }

    treeDatas.sort(function(a, b) {

            return a.children[0].keyword.localeCompare(b.children[0].keyword)
        })
        // console.log($.extend(true, [], treeDatas))
    treeDatas2.sort(function(a, b) {
        if (a.key == false) return 1
        return a.keyword.localeCompare(b.keyword)
    })
    for (var i in treeDatas2) {
        treeDatas.push(treeDatas2[i])
    }


    self.treeDatas = treeDatas
    if (self.merge)
        self.mergeTrees(self)
    else self.splitNodes(self)

    function getColor(dta) {
        // console.log(dta)
        var rt = {}
        rt.num = 1 // （合并前、后）关键词的数量,微博数量
        rt.childNum = 0 //(孩子节点的数量)
        if (dta.featuredKeyword == null || dta.featuredKeyword == undefined) {
            rt.keyword = 'null'
            if (self.notNull(dta.keywords))
                rt.keywords = dta.keywords.toString()
            else rt.keywords = ''
        } else rt.keyword = dta.featuredKeyword
        if (keywordAttributesMapping[rt.keyword] != null) {
            rt.color = keywordAttributesMapping[rt.keyword].color
            rt.key = true
        } else {
            rt.color = 'white'
            rt.key = false
        }
        var date = new Date()
        date.setTime(1000*dta.data.t)

        var mesage = 'Author: ' + dta.data.name +'\n' + 
                     'Date: ' + date.Format("yyyy-MM-dd") + '\n' +
                     'Message: ' + dta.data.text
        rt.texts = [mesage]
        rt.data = [dta]
        return rt
    }
}
MapGlyph.prototype.redraw = function() {
    var self = this
    if (self.merge) {
        self.mergeTrees(self)
    } else {
        self.splitNodes(self)
    }
}
MapGlyph.prototype.updateText = function(showEnglish) {
    d3.select('#glyphSvg').selectAll('.gnode')
        .select('text')
        .text(function(d) {
            if (d.data.key) {
                if (showEnglish) return window.Chinese2English[d.data.keyword]
                else return d.data.keyword
            } else return ''
        })
}
MapGlyph.prototype.mergeTrees = function(self) {

    var svg = self.svg
    var padding = self.padding
    var height = self.H - padding.top - padding.bottom
    var width = self.W - padding.left - padding.right
    svg.selectAll('g').remove()
    var g = svg.append('g').attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
    var treeDatas = $.extend(true, [], self.treeDatas)

    var W = width / 3
    var mergeTrees = []
    var leftTrees = []
    var rightTrees = []

    for (var i = 0; i < treeDatas.length; i++) {
        var tree = treeDatas[i]
        if (tree.dep == 0) {
            var leftTree = {}
            leftTree.color = tree.children[0].color
            leftTree.key = tree.children[0].key
            leftTree.num = tree.children[0].num
            leftTree.childNum = 1
            leftTree.keyword = tree.children[0].keyword
            leftTree.children = []
            leftTree.dep = 1
            leftTree.texts = tree.children[0].texts
            leftTree.data = tree.children[0].data
            var tmp = $.extend(true, {}, tree)
            delete(tmp['children'])
            leftTree.children.push(tmp)
            tmp.childNum = 0
            leftTrees.push(leftTree)
            rightTrees.push($.extend(true, {}, tree.children[0]))
        } else {
            rightTrees.push(tree)
        }
    }

    var sleftTrees = merge(leftTrees) // 右边 树长度一定大于等于左边，index 相对应
    var srightTrees = merge(rightTrees)

    // console.log($.extend(true, [], sleftTrees))
    // console.log($.extend(true, [], srightTrees))

    srightTrees = rightMerge(srightTrees, sleftTrees.length)
        // 右边的树还有要合并的部分
        // console.log(srightTrees)
    var index = d3.range(srightTrees.length)

    index.sort(function(a, b) {
        if (srightTrees[b].childNum > srightTrees[a].childNum) return 1
        if (srightTrees[b].childNum < srightTrees[a].childNum) return -1
        if (srightTrees[b].childNum == srightTrees[a].childNum) {
            return srightTrees[b].keyword.localeCompare(srightTrees[a].keyword)
        }
        // return srightTrees[b].childNum - srightTrees[a].childNum
    })


    var toShowNum = index.length * self.topRate

    var hs = [] // 按照节点的转发数量调整高度
    var llen = sleftTrees.length,
        rlen = srightTrees.length;

    var tchild = 0
    for (var i = 0; i < toShowNum; i++) {
        var ind = index[i]
        if (self.notNull(srightTrees[ind].children))
            tchild += srightTrees[ind].children.length
        else tchild += 1
        hs.push(srightTrees[ind].childNum + 1) // 树的高度是所有孩子的数量
    }
    // for (var i = 0; i < toShowNum; i++) {
    //     var ind = index[i]
    //     if (ind >= llen) {
    //         if (self.notNull(srightTrees[ind].children))
    //             hs.push(srightTrees[ind].children.length) // 画合并树的时候，高度是合并后孩子的数量
    //         else hs.push(1)
    //     } else {
    //         var lnum, rnum
    //         if (self.notNull(sleftTrees[ind].children))
    //             lnum = sleftTrees[ind].children.length
    //         else lnum = 1
    //         if (self.notNull(srightTrees[ind].children))
    //             rnum = srightTrees[ind].children.length
    //         else rnum = 1
    //         hs.push(Math.max(lnum, rnum))
    //     }
    // }

    // for (var t = 0; t < llen; t++) {
    //     if (sleftTrees[t].children != null && sleftTrees[t].children != undefined)
    //         hs.push(sleftTrees[t].children.length)
    //     else hs.append(1)
    // }
    // for (var t = 0; t < rlen; t++) {
    //     var num
    //     if (srightTrees[t].children != null && srightTrees[t].children != undefined)
    //         num = srightTrees[t].children.length
    //     else num = 1
    //     if (t < llen) hs[t] = Math.max(hs[t], num)
    //     else hs.push(num)
    // }
    // console.log(sleftTrees)
    // console.log(srightTrees)
    var unitH = height / d3.sum(hs),
        psum = 0

    for (var i = 0; i < toShowNum; i++) {
        var ind = index[i]
        if (ind < sleftTrees.length) {
            var preH = psum * unitH
            var cnum = 1
            if (self.notNull(sleftTrees[ind].children)) {
                cnum = sleftTrees[ind].children.length
            }
            self.drawTree(g, sleftTrees[ind], hs[i] * unitH / cnum, W, width, i, -1, preH, hs[i] * unitH, 1)
        }
        psum += hs[i]
    }
    psum = 0
    for (var i = 0; i < toShowNum; i++) {
        var ind = index[i]
        var preH = psum * unitH
        if (self.notNull(srightTrees[ind].children)) {
            cnum = srightTrees[ind].children.length
        } else cnum = 1
        self.drawTree(g, srightTrees[ind], hs[i] * unitH / cnum, W, width, i, 1, preH, hs[i] * unitH, 1)

        psum += hs[i]
    }

    console.log('time confused for glyph drawing', (new Date() - self.start) / 1000)

    function merge(trees) {
        // console.log(trees)
        var newTrees = []
        for (var i = 0; i < trees.length;) {
            var tree = $.extend(true, {}, trees[i])
            var j = 0
            if (tree.children == null || tree.children == undefined) tree.children = []
            for (j = i + 1; j < trees.length; j++) {
                if (trees[i].keyword == trees[j].keyword) {
                    tree.num += 1
                    tree.childNum += trees[j].childNum
                    tree.data.push(trees[j].data[0])
                    tree.texts.push(trees[j].texts[0])
                    for (var k in trees[j].children) {
                        tree.children.push(trees[j].children[k])
                    }
                } else {
                    break
                }
            }
            if (tree.children.length > 0) {
                var children = $.extend(true, [], tree.children)
                children.sort(function(a, b) {
                    if (a.key == false) return 1
                    return a.keyword.localeCompare(b.keyword)
                })
                delete(tree['children'])
                var childs = []
                for (var k = 0; k < children.length;) {
                    var child = children[k]
                    var l
                    for (l = k + 1; l < children.length; l++) {
                        if (children[l].keyword == child.keyword) {
                            child.num += 1
                            child.texts.push(children[l].texts[0])
                            child.data.push(children[l].data[0])
                            if (child.keyword == 'null') {
                                child.keywords += ',' + children[l].keywords
                            }
                        } else {
                            break
                        }
                    }
                    k = l
                    childs.push(child)
                }
                childs.sort(function(a, b) {
                    if (b.num > a.num) return 1
                    if (b.num == a.num) return b.keyword.localeCompare(a.keyword)
                    if (b.num < a.num) return -1
                })
                tree['children'] = childs
                newTrees.push(tree)
            } else {
                delete tree['children']
                newTrees.push(tree)
            }

            i = j
        }

        return newTrees
    }

    function rightMerge(trees, start) { // start 前后会有树重叠，而且一定只重叠一次
        var newTrees = []
        for (var i = 0; i < start; i++) {
            newTrees.push(trees[i])
        }
        for (var i = start; i < trees.length; i++) {
            var merge = false
            for (var j = 0; j < start; j++) {
                if (trees[i].keyword == newTrees[j].keyword) {
                    newTrees[j].num += trees[i].num
                    newTrees[j].childNum += trees[i].childNum
                    for (var k in trees[i].texts) {
                        newTrees[j].texts.push(trees[i].texts[k])
                    }
                    for (var k in trees[i].data) {
                        newTrees[j].data.push(trees[i].data[k])
                    }
                    if (!self.notNull(newTrees[j].children)) {
                        newTrees[j].children = []
                    }
                    for (var k in trees[i].children) {
                        newTrees[j].children.push(trees[i].children[k])
                    }

                    // merge children 
                    var children = $.extend(true, [], newTrees[j].children)
                    children.sort(function(a, b) {
                        if (a.key == false) return 1
                        return a.keyword.localeCompare(b.keyword)
                    })
                    delete(newTrees[j]['children'])
                    var childs = []
                    for (var k = 0; k < children.length;) {
                        var child = children[k]
                        var l
                        for (l = k + 1; l < children.length; l++) {
                            if (children[l].keyword == child.keyword) {
                                child.num += children[l].num
                                for (var z in children[l].texts) {
                                    child.texts.push(children[l].texts[z])
                                }
                                for (var z in children[l].data) {
                                    child.data.push(children[l].data[z])
                                }
                                if (child.keyword == 'null') {
                                    child.keywords += ',' + children[l].keywords
                                }
                            } else {
                                break
                            }
                        }
                        k = l
                        childs.push(child)
                    }
                    childs.sort(function(a, b) {
                        if (b.num > a.num) return 1
                        if (b.num == a.num) return b.keyword.localeCompare(a.keyword)
                        if (b.num < a.num) return -1
                    })
                    newTrees[j]['children'] = childs
                    merge = true
                }
            }
            if (!merge) {
                newTrees.push(trees[i])
            }
        }
        return newTrees
    }


}

MapGlyph.prototype.splitNodes = function(self) {
    var svg = self.svg
    var padding = self.padding
    var height = self.H - padding.top - padding.bottom
    var width = self.W - padding.left - padding.right
    svg.selectAll('g').remove()
    var g = svg.append('g').attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
    var treeDatas = $.extend(true, [], self.treeDatas)
        // sort by children num of mid nodes
    treeDatas.sort(function(a, b) {
        var lena = self.childrenLength(a)
        var lenb = self.childrenLength(b)
            // console.log(lena, lenb,
            //  a, b)
        if (lenb > lena) return 1
        if (lenb < lena) return -1
        if (lenb == lena) {
            var ak = (a.dep == 0 ? a.children[0].keyword : a.keyword)
            var bk = (b.dep == 0 ? b.children[0].keyword : b.keyword)
            return bk.localeCompare(ak)
        }
    })
    var toShowNum = self.topRate * treeDatas.length
    var W = width / 3
    var hs = []
    var tchild = 0
    for (var i = 0; i < toShowNum; i++) {
        if (treeDatas[i].dep == 0) {
            // if(self.notNull(treeDatas[i].children[0].children)){
            //     tchild += treeDatas[i].children[0].children.length
            // }
            hs.push(treeDatas[i].children[0].childNum + 1) //防止0
        } else {
            // if(self.notNull(treeDatas[i].children)){
            //     tchild += treeDatas[i].children.length
            // }
            hs.push(treeDatas[i].childNum + 1)
        }
    }
    var unitH = height / d3.sum(hs)
    var psum = 0
    for (var i = 0; i < toShowNum; i++) {
        var preH = psum * unitH
        self.drawTree(g, treeDatas[i], unitH, W, width, i, 1, preH, hs[i] * unitH, 0)
        psum += hs[i]
    }

    // svg.append("rect")
    //     .attr("width", self.W - padding.left - padding.right)
    //     .attr("height", self.H - padding.top - padding.bottom)
    //     .style("fill", "none")
    //     .style("pointer-events", "all")
    //     .call(d3.zoom()
    //         .scaleExtent([1 / 2, 4])
    //         .on("zoom", zoomed))
    //     .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
    //     .attr('z-index',100)
    //     .style('cursor', 'pointer')


    // function zoomed() {
    //     g.attr("transform", d3.event.transform);
    // }
}
MapGlyph.prototype.drawTree = function(svg, tree, height, W, width, i, tag, preH, nowH, splitOrMerge) {
    // splitOrMerge split 0 merge 1
    var self = this
    var j = 0
    var treemap = d3.tree().size([nowH - 2, width])
    var rut = d3.hierarchy(tree, function(d) {
        return d.children
    })
    rut.x0 = nowH / 2
    rut.y0 = 0
    var textShow = false
        //console.log(height)
    if (height > self.textHeight) textShow = true
    var treeData = treemap(rut)
    var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1)

    nodes.forEach(function(d) { d.y = d.depth * W * tag })

    var g = svg.append('g').attr('transform', 'translate(' + (tree.dep * W + 30) + ',' + preH + ')')

    var node = g.selectAll('g.node').data(nodes, function(d) {
        return d.id || (d.id = ++j)
    })
    var R = self.R
    var nodeEnter = node.enter().append('g')
        .attr('class', 'gnode')
        .attr('transform', function(d) {
            return 'translate(' + rut.y0 + ',' + rut.x0 + ')'
        })
    nodeEnter.append('circle')
        .attr('class', 'gnode')
        .attr('r', function(d) {
            //return globalSizeMapping(d.data.num)
            var num = d.data.num
            return calRadius(num, R)
        })
        .attr('display', function(d) {
            if (tag == -1 && d.data.dep == 1) {
                return 'none'
            }
            return 'block'
        })
        .style('fill', function(d) {
            d.data.color
        })
        .style("fill-opacity", 0.5)
        .style('stroke', function(d) {
            return 'black'
        })
        .style('stroke-width', '1px')
        .append('title')
        .text(function(d) {
            var str = ''
            for (var i in d.data.texts) {
                str = str + d.data.texts[i] + '\n'
            }
            return str
        })
    nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', function(d) {
            if (tag == 1 && d.data.dep == 1) return -11
            return d.children || d._children || tag == -1 ? -11 : 11
        })
        .attr('text-anchor', function(d) {
            if (tag == 1 && d.data.dep == 1) return 'end'
            return d.children || d._children || tag == -1 ? 'end' : 'start'
        })
        .text(function(d) {
            if (d.data.key) {
                if (window.showEnglish) return window.Chinese2English[d.data.keyword]
                else
                    return d.data.keyword
            } else {
                // return ''
                // console.log(d)
                return ''
                var keywords = d.data.keywords.split(',')
                    // console.log(keywords)
                    // return keywords[0]
                var word2num = {}
                for (var i in keywords) {
                    if (keywords[i] != word2num) {
                        word2num[keywords[i]] = 0
                    }
                    word2num[keywords[i]] += 1
                }
                var mK = 0,
                    mword = ''

                for (var k in word2num) {
                    if (word2num[k] > mK) {
                        mK = word2num[k]
                        mword = k
                    }
                }
                // console.log(word2num)
                return mword
            }
        })
        // .style('font', '12px sans-serif')
        .style('font-size', '0.7em')
        .attr('display', function(d) {
            if (d.data.dep == 1) {
                if (height > self.textHeight / 2 || d.data.childNum > 7)
                    return 'block'
            }
            if (textShow) return 'block'
            return 'none'
        })

    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.gnode')
        .attr('r', function(d) {
            // return globalSizeMapping(d.data.num)
            var num = d.data.num
            return calRadius(num, R)
        })
        .style("fill", function(d) {
            return d.data.color
        })
        .style("fill-opacity", 0.5)
        .on('click', function(d) {
            if (d.data.dep == 1) {
                console.log(d.data)
                console.log(d.data.data)
                weiboTable.highlightTableByWeibo(d.data.data)
            }
        })
        .append('title')
        .text(function(d) {
            var str = ''
            for (var i in d.data.texts) {
                str = str + d.data.texts[i] + '\n'
            }
            return str
        })


    var link = g.selectAll('path.glink')
        .data(links, function(d) {
            return d.id
        })

    var linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'glink')
        .attr('d', function(d) {
            var o = { x: rut.x0, y: rut.y0 }
            return diagonal(o, o)
        })
        .style('fill', 'none')
        .style('stroke', '#ccc')
        .style('stroke-width', '1px')

    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate
        .attr('d', function(d) {
            return diagonal(d, d.parent)
        });

    // Remove any exiting links
    var linkExit = link.exit()
        .attr('d', function(d) {
            var o = { x: source.x, y: source.y }
            return diagonal(o, o)
        })
        .remove();

    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });



    function calRadius(num, R) {
        if (num == 0) return R / 2
        if (num == 1) return R
        if (num < 4) return R * 1.2
        if (num < 10) return R * 1.5
        if (num < 30) return R * 1.8
        if (num < 60) return R * 2.0
        return R * 2.3
    }

    function collapse(d) {
        if (d.children) {
            d._children = d.children
            d._children.forEach(collapse)
            d.children = null
        }
    }

    function diagonal(s, d) {

        var path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`

        return path
    }

}

MapGlyph.prototype.notNull = function(a) {
    if (a != null && a != undefined) return true
    return false
}
MapGlyph.prototype.childrenLength = function(a) {
    var self = this
    if (a.dep === 0) {
        return a.children[0].childNum
    } else {
        return a.childNum
    }
}

MapGlyph.prototype.showKeyPlayer = function(data) {
    console.log(data)
}

// tree
/*
var MapGlyph = function(svgId) {

    var self = this
    var width = $('#' + svgId).width()*0.2
    var height = $('#' + svgId).height()*0.2
    var svg = d3.select('#' + svgId).append('g').attr('id', '#glyph')
    self.svg = svg
    self.width = width
    self.height = height

}

MapGlyph.prototype.show = function(data) {
    console.log($.extend({}, true, data))

    var self = this
    var svg = this.svg
    var height = this.height
    var width = this.width
    svg.selectAll('g').remove()

    var treemap = d3.tree().size([height, width])


    var treeDatas = []

    //color set 
    for (var i in data) {
        var color = 'green'
        if (data[i].keywords != null) {
            for (var j in data[i].keywords) {
                if (keywordAttributesMapping[data[i].keywords[j]] != null) {
                    color = keywordAttributesMapping[data[i].keywords[j]].color
                    break
                }
            }
        }
        data[i].color = color
        var color = 'green'
        if (data[i].parent != null) {
            if (data[i].parent.keywords != null) {
                for (var j in data[i].parent.keywords) {
                    if (keywordAttributesMapping[data[i].parent.keywords[j]] != null) {
                        color = keywordAttributesMapping[data[i].parent.keywords[j]].color
                        break
                    }
                }
            }
            data[i].parent.color = color
        }
        var children = data[i].children
        for (var i in children) {
            var color = 'green'
            if (children[i].keywords != null) {
                for (var j in children[i].keywords) {
                    if (keywordAttributesMapping[children[i].keywords[j]] != null) {
                        color = keywordAttributesMapping[children[i].keywords[j]].color
                    }
                }
            }
            children[i].color = color
        }
    }
    for (var i in data) {
        var tree = {}
        if (data[i].parent == null) {
            var mid = {}
            mid.name = data[i].keywords[0]
            mid.color = data[i].color
            if (data[i].children != null) {
                mid.children = []
                for (var j in data[i].children) {
                    var child = {}
                    if (data[i].children[j].keywords == undefined) {
                        child.name = 'null'
                    } else {
                        child.name = data[i].children[j].keywords[0]
                    }
                    child.color = data[i].children[j].color
                    if(child.color === 'green') continue;
                    mid.children.push(child)
                }
            }
            treeDatas.push(mid)
        } else {
            console.log('parent')
            tree.name = data[i].parent.keywords[0]
            tree.color = data[i].parent.color
            tree.children = []
            var mid = {}
            mid.name = data[i].keywords[0]
            mid.color = data[i].color
            if (data[i].children != null) {
                console.log('children')
                mid.children = []
                for (var j in data[i].children) {
                    var child = {}
                    child.name = data[i].children[j].keywords[0]
                    child.color = data[i].children[j].color
                    if(child.color ==='green') continue ;
                    mid.children.push(child)
                }
            }
            tree.children.push(mid)
            treeDatas.push(tree)
        }
    }
    var th = height / treeDatas.length
    treemap.size([th, width])
    console.log($.extend({}, true, treeDatas))

    console.log(th, width)
    for (var i in treeDatas) {
        var j = 0
        var treeData = treeDatas[i]

        var rut = d3.hierarchy(treeData, function(d) {
            return d.children
        })
        rut.x0 = th / 2
        rut.y0 = 0
        // rut.children.forEach(collapse)

        var treeData = treemap(rut)

        var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1)
        nodes.forEach(function(d) { d.y = d.depth * 180 })

        var g = svg.append('g').attr('transform', 'translate(60,' + th * i + ')')
        var node = g.selectAll('g.node').data(nodes, function(d) {
            return d.id || (d.id = ++j)
        })

        var nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('transform', function(d) {
                return 'translate(' + rut.y0 + ',' + rut.x0 + ')'
            })
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 3)
            .style('fill', function(d) {
                d.data.color
            })

        nodeEnter.append('text')
            .attr('dy', '.35em')
            .attr('x', function(d) {
                return d.children || d._children ? -13 : 13
            })
            .attr('text-anchor', function(d) {
                return d.children || d._children ? 'end' : 'start'
            })
            .text(function(d) {
                return d.data.name
            })
            .style('font', '12px sans-serif')


        var nodeUpdate = nodeEnter.merge(node);

         // Transition to the proper position for the node
         nodeUpdate
           .attr("transform", function(d) { 
               return "translate(" + d.y + "," + d.x + ")";
            });

         // Update the node attributes and style
         nodeUpdate.select('circle.node')
           .attr('r', 3)
           .style("fill", function(d) {
               return d.data.color
           })
           .attr('cursor', 'pointer')


        var link = g.selectAll('path.link')
            .data(links, function(d) {
                return d.id
            })

        var linkEnter = link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('d', function(d) {
                var o = { x: rut.x0, y: rut.y0 }
                return diagonal(o, o)
            })
            .style('fill', 'none')
            .style('stroke', '#ccc')
            .style('stroke-width', '2px')

        var linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate
            .attr('d', function(d) {
                return diagonal(d, d.parent)
            });

        // Remove any exiting links
        var linkExit = link.exit()
            .attr('d', function(d) {
                var o = { x: source.x, y: source.y }
                return diagonal(o, o)
            })
            .remove();

        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

    }

    function collapse(d) {
        if (d.children) {
            d._children = d.children
            d._children.forEach(collapse)
            d.children = null
        }
    }

    function diagonal(s, d) {

        var path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`

        return path
    }
}
*/


// sankey
/*
var MapGlyph = function(svgId) {

    var self = this
    var width = $('#' + svgId).width()
    var height = $('#' + svgId).height()
    var svg = d3.select('#' + svgId).append('g').attr('id', '#glyph')
    self.svg = svg
    self.width = width
    self.height = height

}

MapGlyph.prototype.show = function(data) {
    var self = this
    var svg = this.svg
    var height = this.height
    var width = this.width
    svg.selectAll('g').remove()

    var sankey = d3.sankey()
        .nodeWidth(10)
        .nodePadding(20)
        .size([width, height])

    var nodes_data = {}
    var links_data = {}

    var index = 0

    //color set 
    for (var i in data) {
        var color = 'green'
        if (data[i].keywords != null) {
            for (var j in data[i].keywords) {
                if (keywordAttributesMapping[data[i].keywords[j]] != null) {
                    color = keywordAttributesMapping[data[i].keywords[j]].color
                    break
                }
            }
        }
        data[i].color = color

        var color = 'green'
        if (data[i].parent != null) {
            if (data[i].parent.keywords != null) {
                for (var j in data[i].parent.keywords) {
                    if (keywordAttributesMapping[data[i].parent.keywords[j]] != null) {
                        color = keywordAttributesMapping[data[i].parent.keywords[j]].color
                        break
                    }
                }
            }
            data[i].parent.color = color
        }


        var children = data[i].children
        for (var i in children) {
            var color = 'green'
            if (children[i].keywords != null) {
                for (var j in children[i].keywords) {
                    if (keywordAttributesMapping[children[i].keywords[j]] != null) {
                        color = keywordAttributesMapping[children[i].keywords[j]].color
                    }
                }
            }
            children[i].color = color
        }
    }

    var mid2left = {}
    for (var i in data) {
        if (!(data[i].color in mid2left)) {
            mid2left[data[i].color] = {}
        }
        if (data[i].parent != null && data[i].parent != undefined) {
            if (!(data[i].parent.color in mid2left[data[i].color])) {
                mid2left[data[i].color][data[i].parent.color] = 0
            }
            mid2left[data[i].color][data[i].parent.color] += 1
        }
    }

    var mid2right = {}
    for (var i in data) {
        if (!(data[i].color in mid2right)) {
            mid2right[data[i].color] = {}
        }
        var children = data[i].children
        if (children != null && children != undefined) {
            for (var j in children) {
                if (!(children[j].color in mid2right[data[i].color])) {
                    mid2right[data[i].color][children[j].color] = 0
                }
                mid2right[data[i].color][children[j].color] += 1
            }
        }
    }

    var nodes = []
    

    var lcolors = []
    var lc2idx = {}
    for (var i in mid2left) {
        for (var j in mid2left[i]) {
            if (lcolors.indexOf(j) == -1) {
                lcolors.push(j)
            }
        }
    }
    var s = +nodes.length
    for (var i in lcolors) {
        lc2idx[lcolors[i]] = s + (+i)
        nodes.push({ 'node': s + (+i), 'name': lcolors[i] })
    }


    var mc2idx = {}
    var mcolors = Object.keys(mid2right)
    var s = +nodes.length
    for (var i in mcolors) {
        mc2idx[mcolors[i]] = s+(+i)
        nodes.push({ 'node': s+(+i), 'name': mcolors[i] })
    }


    var rcolors = []
    var rc2idx = {}
    for (var i in mid2right) {
        for (var j in mid2right[i]) {
            if (rcolors.indexOf(j) == -1) {
                rcolors.push(j)
            }
        }
    }
    var s = +nodes.length
    for (var i in rcolors) {
        rc2idx[rcolors[i]] = s + (+i)
        nodes.push({ 'nodes': s + (+i), 'name': rcolors[i] })
    }

    var links = []
    for (var i in mid2left) {
        var target = mc2idx[i]
        for (var j in mid2left[i]) {
            var source = lc2idx[j]
            var value = mid2left[i][j]
            links.push({ 'source': source, 'target': target, 'value': value })
        }
    }
    for (var i in mid2right) {
        var source = mc2idx[i]
        for (var j in mid2right[i]) {
            // console.log(j)
            var target = rc2idx[j]
            var value = mid2right[i][j]
            links.push({ 'source': source, 'target': target, 'value': value })
        }
    }

    console.log('nodes, links', nodes, links)

    sankey.nodes(nodes)
          .links(links)
          .layout(32)
    var path = sankey.link()
    var link = svg.append('g')
                  .selectAll('.glink')
                  .data(links)
                  .enter()
                  .append('path')
                  .attr('class','glink')
                  .attr('d', path)
                  .style('stroke-width', function(d) {return Math.max(1, d.dy);})
                  .style('fill','grey')
                  .style('stroke','grey')
                  .style('opacity','0.2')
                  .sort(function(a,b) {return b.dy - a.dy;})


    // add in the nodes
    var node = svg.append('g')
                  .selectAll('.gnode')
                  .data(nodes)
                  .enter()
                  .append('g')
                  .attr('class', 'gnode')
                  .attr('transform',function(d){
                    return 'translate(' + d.x + ',' + d.y +')';
                  })
    node.append('rect')
        .attr('height', function(d) { return d.dy ;})
        .attr('width', sankey.nodeWidth())
        .style('fill', function(d) {
            return d.name
        })

}
*/


/*
var MapGlyph = function(svgId) {

    var self = this
    var width = $('#' + svgId).width() / 4
    var height = $('#' + svgId).height() / 4
    var svg = d3.select('#' + svgId).append('g').attr('id','#glyph')
    self.svg = svg
    self.width = width
    self.height = height
    var leftp = 0.2,
        interval = 0.1;
    var midp = (1 - (leftp + interval) * 2)

    self.leftp = leftp
    self.interval = interval
    self.midp = midp
    self.padding = { 'top': 10, 'bottom': 10, 'left': 10, 'right': 10 }
    var xScale = d3.scaleTime().range([10, width * midp - 10])
    self.xScale = xScale
    var yScale = d3.scaleLinear().range([height - self.padding.top - self.padding.bottom, 4])
    self.yScale = yScale

}

MapGlyph.prototype.show = function(data) {

    var self = this
    var width = self.width
    var height = self.height
    var leftp = self.leftp
    var interval = self.interval
    var midp = self.midp
    self.svg.selectAll('g').remove()
    var xScale = self.xScale
    var timeRange = d3.extent(data, function(d) {
        return d.dateTime
    })
    xScale.domain(timeRange)

    var yScale = self.yScale
    for (var i in data) {
        data[i].impact = 0
            // if(data[i].parent !=null){
            //     data[i].impact += 1
            // }
        if (data[i].children != null) {
            data[i].impact += data[i].children.length
        }
        console.log(data[i].impact)
    }
    var yrange = d3.extent(data, function(d) {
        return d.impact
    })
    var padding = self.padding
    yScale.domain(yrange)

    var midg = self.svg.append('g')
        .attr('transform', 'translate(' + (leftp + interval) * width + ',' + padding.top + ')')


    midg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width * midp)
        .attr('height', height)
        .style('stroke', 'grey')
        .style('stroke-width', '1px')
        .style('fill', 'none')

    midg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function(d) {
            return xScale(d.dateTime)
        })
        .attr('cy', function(d) {
            return yScale(d.impact)
        })
        .attr('r', '4')
        .style('fill', function(d) {
            if (d.keywords.length > 0 && keywordAttributesMapping[d.keywords[0]]!=null) {
                return keywordAttributesMapping[d.keywords[0]].color
            } else return 'green'
        })
        .on('click', function(d) {
            console.log(d)
        })

    var leftg = self.svg.append('g')
        .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')

    var R = d3.scaleLinear().domain([0, 100]).range([2, 5])
    var parents = []
    var children = []
    for (var i in data) {
        if (data[i].parent != null) {
            parents.push(data[i].parent)
        }
        if (data[i].children != null) {
            for (var j in data[i].children) {
                children.push(data[i].children[j])
            }
        }
    }

    // 左边

    var leftcolor = {}

    for (var i in parents) {
        var color = 'green'
        if (parents[i].keywords.length > 0) {
            if (keywordAttributesMapping[parents[i].keywords[0]] != null) {
                color = keywordAttributesMapping[parents[i].keywords[0]].color
            }
        }
        if (!(color in leftcolor)) {
            leftcolor[color] = 0
        }
        leftcolor[color] += 1
    }

    var carrs = []
    for (var i in leftcolor) {
        carrs.push([i, leftcolor[i]])
    }
    console.log(carrs)
    var lcyscale = d3.scaleBand().domain(Object.keys(leftcolor))
        .range([0, height - padding.top - padding.bottom]).padding(0.4)

    leftg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width * leftp)
        .attr('height', height)
        .style('stroke', 'grey')
        .style('stroke-width', '1px')
        .style('fill', 'none')

    leftg.selectAll('circle')
        .data(carrs)
        .enter()
        .append('circle')
        .attr('cx', width * leftp / 2)
        .attr('cy', function(d) {
            return lcyscale(d[0])
        })
        .attr('r', function(d) {
            return R(d[1])
        })
        .style('fill', function(d) {
            return d[0]
        })



    // 右边
    var rightcolor = {}

    for (var i in children) {
        var color = 'green'
        if (children[i].keywords != null) {
            if (children[i].keywords.length > 0) {
                for (var j in children[i].keywords) {
                    if (keywordAttributesMapping[children[i].keywords[j]] != null) {
                        color = keywordAttributesMapping[children[i].keywords[j]].color
                        break
                    }
                }
            }
        }
        if (!(color in rightcolor)) {
            rightcolor[color] = 0
        }
        rightcolor[color] += 1
    }

    var carrs = []
    for (var i in rightcolor) {
        carrs.push([i, rightcolor[i]])
    }
    console.log(carrs)
    var rcyscale = d3.scaleBand().domain(Object.keys(rightcolor))
        .range([0, height - padding.top - padding.bottom]).padding(0.4)

    var rightg = self.svg.append('g')
        .attr('transform', 'translate(' + width * (leftp + interval * 2 + midp) + ',' + padding.top + ')')
    rightg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width * leftp)
        .attr('height', height)
        .style('stroke', 'grey')
        .style('stroke-width', '1px')
        .style('fill', 'none')

    rightg.selectAll('circle')
        .data(carrs)
        .enter()
        .append('circle')
        .attr('cx', width * leftp / 2)
        .attr('cy', function(d) {
            return rcyscale(d[0])
        })
        .attr('r', function(d) {
            return R(d[1])
        })
        .style('fill', function(d) {
            return d[0]
        })

    // draw line 

    var line = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
    var lineg = self.svg.append('g')
    for (var i in data) {
        var mx = (leftp + interval) * width + xScale(data[i].dateTime)
        var my = padding.top + yScale(data[i].impact)
        var fx = padding.left + width * leftp / 2
        var fy = padding.top
        var tag = true
        if (data[i].parent != null) {
            var parent = data[i].parent
            var color = 'green'
            if (parent.keywords != null) {
                for (var j in parent.keywords) {
                    if (keywordAttributesMapping[parent.keywords[j]] != null) {
                        color = keywordAttributesMapping[parent.keywords[j]].color
                        break
                    }
                }
            }
            fy += lcyscale(color)

            // lineg.append('line')
            //     .attr('x1', mx)
            //     .attr('y1', my)
            //     .attr('x2', fx)
            //     .attr('y2', fy)
            //     .style('stroke', 'grey')
            //     .style('stroke-width', '1px')

        } else tag = false
        if (data[i].children != null) {
            var children = data[i].children
            for (var j in children) {
                var cx = width * (leftp + interval * 2 + midp) + width * leftp / 2
                var cy = padding.top
                var color = 'green'
                if (children[j].keywords != null) {
                    for (var k in children[j].keywords) {
                        if (keywordAttributesMapping[children[j].keywords[k]] != null) {
                            color = keywordAttributesMapping[children[j].keywords[k]].color
                            break
                        }
                    }
                }
                cy += rcyscale(color)
                    // lineg.append('line')
                    //     .attr('x1', mx)
                    //     .attr('y1', my)
                    //     .attr('x2', cx)
                    //     .attr('y2', cy)
                    //     .style('stroke', 'grey')
                    //     .style('stroke-width', '1px')
                if (tag) {
                    lineg.append('path')
                        .datum([
                            [fx, fy],
                            [mx, my],
                            [cx, cy]
                        ])
                        .attr('d', line)
                        .style('stroke', 'grey')
                } else {
                    lineg.append('path')
                        .datum([
                            [mx, my],
                            [cx, cy]
                        ])
                        .attr('d', line)
                        .style('stroke', 'grey')
                }


            }
        }


    }

}
*/
