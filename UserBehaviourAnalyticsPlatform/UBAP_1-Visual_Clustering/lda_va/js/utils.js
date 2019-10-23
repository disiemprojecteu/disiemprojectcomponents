// Weibo Visualization System

// Author: Donghao Ren
// Date  : 2012.05.23

// utils.js
// A framework for our application.

var WeiboVis = (function() {

// The namespace to output.
var NS = { };

// ======== Utility Functions ========

// Date.getString:
//   Date.getFullString()   Jan 17th, 2012 21:34
//   Date.getDayString()    Jan 17th, 2012
//   Date.getTimeString()   21:34

(function(){
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var num_pad = function(s) {
        var j = s.toString();
        while(j.length < 2) j = '0' + j;
        return j;
    };
    // add th,nd,rd to small integers. example: 23 to 23rd.
    var addth = function(day) {
        if(day % 100 == 11 || day % 100 == 12 || day % 100 == 13) return day + "th";
        if(day % 10 == 1) return day + "st";
        if(day % 10 == 2) return day + "nd";
        if(day % 10 == 3) return day + "rd";
        return day + "th";
        
    };
    Date.prototype.getFullString = function() {
        return months[this.getMonth()] + " " + addth(this.getDate()) + ", " + this.getFullYear() + " " + num_pad(this.getHours()) + ":" + num_pad(this.getMinutes());
    };
    Date.prototype.getDayString = function() {
        return months[this.getMonth()] + " " + addth(this.getDate()) + ", " + this.getFullYear();
    };
    Date.prototype.getTimeString = function() {
        return num_pad(this.getHours()) + ":" + num_pad(this.getMinutes());
    };
    Date.prototype.getFullTimeString = function() {
        return num_pad(this.getHours()) + ":" + num_pad(this.getMinutes()) + ":" + num_pad(this.getSeconds());
    };    
    Date.prototype.getNaiveString = function() {
    	return this.getFullYear() + "/" + (this.getMonth()+1) + "/" + this.getDate();
    };
    Date.prototype.getMonthString = function() {
        return months[this.getMonth()] + ", " + this.getFullYear();
    };
    Date.prototype.getLumpyString = function() {
        return this.getFullYear()+"-"+num_pad(this.getMonth()+1)+"-"+num_pad(this.getDate())+" "+num_pad(this.getHours())+":"+num_pad(this.getMinutes())+":"+num_pad(this.getSeconds());
    };//monthstring modified by csm
    Date.prototype.getNaiveString = function() {
        return this.getFullYear() + "/" + (this.getMonth()+1) + "/" + this.getDate();
    };
    
})();

// Timing functions.
//   waitUntil(condition, on_finished, interval, timeout)
//     wait until condition() == true, call on_finished(true/false).
//     interval and timeout in milliseconds, default interval = 100, timeout = inf.
//   tryRetry(f, on_finished, max_count)
//     try f(callback), if callback(null, result) is called, pass them to on_finished.
//     otherwise, retry f(callback), until success or max_count reached.
//     when failed, on_finished(last_error) is called.

NS.waitUntil = function(condition, on_finished, interval, timeout) {
    if(!timeout) timeout = 1e100;
    var time_started = new Date().getTime();
    var timer = setInterval(function() {
        if(condition()) {
            clearInterval(timer);
            if(on_finished) on_finished(true);
        }
        if(new Date().getTime() - time_started > timeout) {
            clearInterval(timer);
            if(on_finished) on_finished(false);        
        }
    }, interval ? interval : 100);
};


NS.tryRetry = function(f, on_finished, max_count) {
    var tried = 0;
    var try_once = function() {
        f(function(error, result) {
            if(error) {
                tried++;
                if(tried == max_count) {
                    on_finished(error);
                } else {
                    try_once();
                }
            } else {
                on_finished(null, result);
            }
        });
    };
    try_once();
};

// Object Array.
//   packObjects(objects, scheme)
//   unpackObjects(array, scheme)

NS.packObjects = function(objects, scheme) {
    var r = [];
    for(var i in objects) {
        var x = [];
        for(var j in scheme) {
            var def = scheme[j], val;
            if(typeof(def) == "string") {
                val = objects[i][def];
            } else {
                val = objects[i][def.key];
                if(def.encode) val = def.encode(val);
            }
            x.push(val);
        }
        r.push(x);
    }
    return r;
};

NS.unpackObjects = function(array, scheme) {
    var r = [];
    for(var i in array) {
        var x = array[i];
        var obj = { };
        for(var j in scheme) {
            var def = scheme[j], val = x[j];
            if(typeof(def) == "string") {
                obj[def] = val;
            } else {
                if(def.decode) val = def.decode(val);
                obj[def.key] = val;
            }
        }
        r.push(obj);
    }
    return r;
};

NS.getQuery = function(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
};

// Colors.
//   from http://colorbrewer2.org
var color_qualitative = [
    "166,206,227","31,120,180","178,223,138","51,160,44","251,154,153","227,26,28",
    "253,191,111","255,127,0","202,178,214","106,61,154","255,255,153"
];
color_qualitative.getColor = function(index) {
    return color_qualitative[index % color_qualitative.length];
}
var color_qualitative_warm = [
    "255,255,204","255,237,160","254,217,118","254,178,76",
    "253,141,60","252,78,42","227,26,28","189,0,38","128,0,38"
];
var color_qualitative_cold = [
    "255,247,251","236,231,242","208,209,230","116,189,219",
    "116,169,207","54,144,192","5,112,176","4,90,141","2,56,88"
];
var gradient_interpolate = function(p, gradient) {
    if(p < 0) return gradient[0];
    if(p >= 1) return gradient[gradient.length - 1];
    var pos = p * (gradient.length - 1);
    var idx = Math.floor(pos);
    var dp = pos - idx;
    var dq = 1 - dp;
    var v1 = idx < gradient.length ? gradient[idx] : gradient[gradient.length - 1];
    var v2 = idx + 1 < gradient.length ? gradient[idx + 1] : gradient[gradient.length - 1];
    return [parseInt(v1[0] * dq + v2[0] * dp),
            parseInt(v1[1] * dq + v2[1] * dp),
            parseInt(v1[2] * dq + v2[2] * dp)];
};
var create_gradient = function(str_array) {
    var obj = str_array.map(function(x) {
        var s = x.split(",");
        return [parseInt(s[0]), parseInt(s[1]), parseInt(s[2])];
    });
    obj.getColor = function(p) {
        return gradient_interpolate(p, obj).join(",");
    };
    return obj;
};
NS.colormap = { };
NS.colormap.cold = create_gradient(color_qualitative_cold);
NS.colormap.warm = create_gradient(color_qualitative_warm);
NS.colormap.qualitative = color_qualitative;

NS.addGradient = function(name, desc) {
    NS.colormap[name] = create_gradient(desc);
};

// ======== Values and Events ========

// Key-Value Management:
//   addValue(key, type, initial), alias: add
//   setValue(key, value, post_event[default: true]), alias: set
//   getValue(key), alias: get
//   addValueListener(key, listener, priority), alias: listen
// Event Management:
//   addEvent(key)
//   addListener(key, listener, priority), alias: on
//   raiseEvent(key, parameters), alias: raise

NS_values = { };
NS_events = { };

var value_event_prefix = "__value:";

NS.addValue = function(key, type, initial) {
    if(initial === undefined || initial === null) {
        if(type == "bool") initial = false;
        if(type == "string") initial = "";
        if(type == "number") initial = 0;
        if(type == "object") initial = { };
    }
    NS_values[key] = {
        type: type,
        value: initial
    };
    NS.addEvent(value_event_prefix + key);
    return NS;
};
NS.add = NS.addValue;

NS.setValue = function(key, value, post_event) {
    NS_values[key].value = value;
    if(post_event === null || post_event === undefined || post_event === true) {
        NS.raiseEvent(value_event_prefix + key, value);
    }
    return NS;
};
NS.set = NS.setValue;

NS.getValue = function(key) {
    return NS_values[key].value;
};
NS.get = NS.getValue;

NS.addValueListener = function(key, listener, priority) {
    NS.addListener(value_event_prefix + key, listener, priority);
    return NS;
};
NS.listen = NS.addValueListener;

NS.addListener = function(key, listener, priority) {
    if(!priority) priority = 1;
    var ev = NS_events[key];
    ev.listeners.push({ f: listener, p: priority });
    ev.listeners.sort(function(a, b) {
        return b.p - a.p;
    });
    return NS;
};
NS.on = NS.addListener;

NS.addEvent = function(key) {
    NS_events[key] = {
        listeners: [],
        running: false
    };
    return NS;
};

NS.raiseEvent = function(key, parameters) {
    var ev = NS_events[key];
    if(ev.running) return NS;
    ev.running = true;
    for(var i in ev.listeners) {
        var r;
        try {
            r = ev.listeners[i].f(parameters);
        } catch(e) {
        }
        if(r) break;
    }
    ev.running = false;
    return NS;
};
NS.raise = NS.raiseEvent;

// ======== SHA-1 Checksum ========
(function() {
// Calculate SHA1 of the bytes array.
// Convert UTF-8 string to bytes array.
function sha1_str2bytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
}
// Convert UTF-8 bytes array back to string.
function sha1_bytes2str(bytes) {
    var string = "";
    var i = 0;
    var c;
    while(i < bytes.length) {
        c = bytes[i];
        string += String.fromCharCode(c);
        i++;
    }
    return string;
}
// Convert a hex string to bytes array.
function sha1_hex2bytes(hexstr) {
    var bytes = [];
    var trans = function(c) {
        if(c <= 0x39 && c >= 0x30) return c - 0x30;
        if(c <= 0x66 && c >= 0x61) return c - 0x61 + 10;
        if(c <= 0x46 && c >= 0x41) return c - 0x41 + 10;
        return 0;
    }
    for(var i = 0; i < hexstr.length; i += 2) {
        bytes.push(trans(hexstr.charCodeAt(i)) << 4 | trans(hexstr.charCodeAt(i + 1)));
    }
    return bytes;
}
// Convert bytes array to hex string.
function sha1_bytes2hex(bytes) {
    var str = "";
    var hex_digits = "0123456789abcdef";
    for(var i = 0; i < bytes.length; i++) {
        str += hex_digits[bytes[i] >> 4];
        str += hex_digits[bytes[i] % 16];
        //str += "("+bytes[i] + ")";
    }
    return str;
}
function sha1_hash(data) {
    var sha1_add = function(x, y) {
        var lb = (x & 0xFFFF) + (y & 0xFFFF);
        var hb = (x >> 16) + (y >> 16) + (lb >> 16);
        return (hb << 16) | (lb & 0xFFFF);
    };
    var sha1_S = function(n, x) {
        return (x << n) | (x >>> (32 - n));
    };
    var sha1_const_K = function(t) {
        if(t < 20) return 0x5A827999;
        if(t < 40) return 0x6ED9EBA1;
        if(t < 60) return 0x8F1BBCDC;
        return 0xCA62C1D6;
    };
    var sha1_func = function(t, B, C, D) {
        if(t < 20) return (B & C) | ((~B) & D);
        if(t < 40) return B ^ C ^ D;
        if(t < 60) return (B & C) | (B & D) | (C & D);
        return B ^ C ^ D;
    };
    var sha1_append = function(bytes) {
        var len = 8 * bytes.length;
        bytes.push(128);
        var n_append = 56 - bytes.length % 64;
        if(n_append < 0) n_append += 64;
        for(var i = 0; i < n_append; i++) bytes.push(0);
        bytes.push(0); bytes.push(0); bytes.push(0); bytes.push(0);
        bytes.push((len >> 24) & 0xFF);
        bytes.push((len >> 16) & 0xFF);
        bytes.push((len >> 8) & 0xFF);
        bytes.push(len & 0xFF);
        return bytes;
    };
    bytes = sha1_append(data);
    words = [];
    for(var i = 0; i < bytes.length; i += 4) {
        var w = bytes[i] << 24 | bytes[i + 1] << 16 | bytes[i + 2] << 8 | bytes[i + 3];
        words.push(w);
    }
    H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    for(var i = 0; i < words.length; i += 16) {
        W = [];
        for(var t = 0; t < 16; t++) W[t] = words[i + t];
        for(var t = 16; t < 80; t++)
            W[t] = sha1_S(1, W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16]);
        A = H[0]; B = H[1]; C = H[2]; D = H[3]; E = H[4];
        for(var t = 0; t < 80; t++) {
            tmp = sha1_add(sha1_S(5, A), sha1_add(sha1_add(sha1_add(sha1_func(t, B, C, D), E), W[t]), sha1_const_K(t)));
            E = D; D = C; C = sha1_S(30, B); B = A; A = tmp;
        }
        H[0] = sha1_add(H[0], A);
        H[1] = sha1_add(H[1], B);
        H[2] = sha1_add(H[2], C);
        H[3] = sha1_add(H[3], D);
        H[4] = sha1_add(H[4], E);
    }
    var rslt = [];
    for(var i = 0; i < 5; i++) {
        rslt.push((H[i] >> 24) & 0xFF);
        rslt.push((H[i] >> 16) & 0xFF);
        rslt.push((H[i] >> 8) & 0xFF);
        rslt.push(H[i] & 0xFF);
    }
    return rslt;
}
NS.sha1str = function(s) {
    return sha1_bytes2hex(sha1_hash(sha1_str2bytes(s)));
};
})();

// ======== Controls ========

// Slider.
// params: value, value_inverse, label, default_value
// functions:
//  setParams: set new parameters.
//  sliderSet: set value of the slider.
//  sliderEvent(new_value, is_up)
NS.createSlider = function(object, params) {
    if(!params) params = {};
    var value_func = params.value ? params.value : function(x) { return x; };
    var value_ifunc = params.value_inverse ? params.value_inverse : function(x) { return x; };
    var label_func = params.label ? params.label : function(x) { return x.toFixed(2); };
    var default_value = params.default_value ? params.default_value : 0;
    
    // object should be a div element.
    var elem = object;
    var width = parseInt($(elem).css("width").replace('px',''));
    $(elem).addClass("slider");
    elem.innerHTML = '<div class="bg"></div><div class="label"></div><div class="box"></div>';
    var box = $(elem).children('.box');
    box.css("left", "0px");
    var label = $(elem).children('.label');
    var box_w = box.width();
    var is_dragging = false;
    var x0 = 0, tx0 = 0;
    
    elem.setParams = function(params) {
        if(params.value) value_func = params.value;
        if(params.value_inverse) value_ifunc = params.value_inverse;
        if(params.label) label_func = params.label;
        elem.sliderSet(elem.sliderValue);
    };
    
    var onchange = function(x) {
        var t = x / (width - box_w);
        slider_set(t);
        if(elem.sliderEvent != undefined) {
            elem.sliderEvent(elem.sliderValue, false);
        }
    };
    var onchange_up = function() {
        if(elem.sliderEvent != undefined) {
            elem.sliderEvent(elem.sliderValue, true);
        }
    };
    var this_t = 0;
    var slider_set = function(t) {
        this_t = t;
        var x = t * (width - box_w);
        box.css('left', x + "px");
        if(x + box_w / 2 > width / 2)
            label.css("text-align", "left");
        else
            label.css("text-align", "right");
        elem.sliderValue = value_func(t);
        label.html(label_func(elem.sliderValue));
    };
    
    elem.sliderSet = function(val) {
        slider_set(value_ifunc(val));
    };
    
    box.mousedown(function(e) {
        is_dragging = true;
        x0 = e.pageX;
        tx0 = parseInt(box.css('left').replace('px',''));
        e.stopPropagation();
        e.preventDefault();
    });
    $(elem).mousedown(function(e) {
        var xx = e.pageX - $(elem).offset().left - box_w / 2;
        if(xx < 0) xx = 0;
        if(xx > width - box_w) xx = width - box_w;
        onchange(xx);
        is_dragging = true;
        x0 = e.pageX;
        tx0 = parseInt(box.css('left').replace('px',''));
        e.stopPropagation();
        e.preventDefault();
    });
    $(window).mousemove(function(e) {
        if(is_dragging) {
            var xx = tx0 + e.pageX - x0;
            if(xx < 0) xx = 0;
            if(xx > width - box_w) xx = width - box_w;
            onchange(xx);
        }
    });
    
    $(window).mouseup(function() {
        if(is_dragging) {
            is_dragging = false;
            onchange_up();
        }
    });
    elem.sliderSet(default_value);
    return object;
};

// ======== Local Storage ========

NS.localStoragePrefix = "wbvis_events_";

NS.addEvent("storage");

NS.saveObject = function(key, object) {
    window.localStorage.setItem(this.localStoragePrefix + key, JSON.stringify(object));
};
NS.saveString = function(key, str) {
    window.localStorage.setItem(this.localStoragePrefix + key, str);
};

NS.removeObject = function(key) {
    window.localStorage.removeItem(this.localStoragePrefix + key);
};

NS.loadObject = function(key) {
    var item = window.localStorage.getItem(this.localStoragePrefix + key);
    if(item) return JSON.parse(item);
    return null;
};
NS.loadString = function(key) {
    var item = window.localStorage.getItem(this.localStoragePrefix + key);
    if(item) return item;
    return null;
};

NS.storageKeys = function() {
    var keys = [];
    for(var i in window.localStorage) {
        if(i.substr(0, NS.localStoragePrefix.length) == NS.localStoragePrefix) {
            var key = i.substr(NS.localStoragePrefix.length);
            keys.push(key)
        }
    }
    return keys;
};

window.addEventListener("storage", function(e) {
    if(!e) e = window.event;
    if(e.key.substr(0, NS.localStoragePrefix.length) == NS.localStoragePrefix) {
        var key = e.key.substr(NS.localStoragePrefix.length);
        NS.raiseEvent("storage", {
            key: key,
            old_value: JSON.parse(e.oldValue),
            new_value: JSON.parse(e.newValue),
            url: e.url });
    }
}, false);

// ======== Bindings ========

// Bind HTML elements to values or events.
//   bindButton(selection, event_key)
//   bindToggle(selection, key)
//   bindOption(selection, key)
//   bindText(selection, key, connector)
//   bindSlider(selection, key, connector)
//     element_state = connector.in(value);
//     value = connector.out(element_state);
//   bindElement(selection, key, transformer), HTML = transformer(value);

NS.bindButton = function(selection, event) {
    selection.click(function() {
        NS.raiseEvent(event);
    });
    return NS;
};

NS.bindToggle = function(selection, key) {
    var state = NS.getValue(key);
    if(state) selection.addClass("active");
    else selection.removeClass("active");
    selection.click(function() {
        state = !state;
        NS.setValue(key, state, true);
    });
    NS.addValueListener(key, function(new_state) {
        state = new_state;
        if(state) selection.addClass("active");
        else selection.removeClass("active");
    });
    return NS;
}; // 左手钢琴协奏曲 拉威尔

NS.bindOption = function(selection, key) {
    selection.removeClass("active");
    selection.filter(".option-" + NS.getValue(key)).addClass("active");
    selection.click(function() {
        var option = $(this).attr("class").match(/option-([0-9a-zA-Z\_\-\.]+)/)[1];
        NS.setValue(key, option, true);
    });
    NS.addValueListener(key, function(state) {
        selection.removeClass("active");
        selection.filter(".option-" + state).addClass("active");
    });
    return NS;
};

NS.bindText = function(selection, key, connector) {
    if(!connector) connector = { };
    var fin = connector.filter_in ? connector.filter_in : function(x) { return x; };
    var fout = connector.filter_out ? connector.filter_out : function(x) { return x; };
    selection.val(NS.getValue(key));
    var forbid_this = false;
    selection.change(function() {
        forbid_this = true;
        NS.setValue(key, fout($(selection).val()), true);
        forbid_this = false;
    });
    NS.addValueListener(key, function(value) {
        if(forbid_this) return;
        selection.val(fin(value));
    });
    return NS;
};

NS.bindSlider = function(selection, key, continuous, connector) {
    if(!connector) connector = { };
    var fin = connector.filter_in ? connector.filter_in : function(x) { return x; };
    var fout = connector.filter_out ? connector.filter_out : function(x) { return x; };
    selection.each(function() {
        var slider = this;
        slider.sliderEvent = function(val, is_up) {
            if(continuous || is_up) {
                // changed.
                NS.setValue(key, fout(slider.sliderValue));
            }
        };
    });
    var update = function(value) {
        selection.each(function() {
            this.sliderSet(fin(value));
        });
    };
    update(NS.getValue(key));
    NS.addValueListener(key, update);
};

NS.bindElement = function(selection, key, transformer) {
    var rep = transformer ? transformer(NS.getValue(key)) : NS.getValue(key);
    selection.html(rep);
    NS.addValueListener(key, function(value) {
        var rep = transformer ? transformer(value) : value;
        selection.html(rep);
    });
    return NS;
};

// ======== i18n Support ========

var langs = { };

NS.language = function(name) {
    if(langs[name] == undefined) {
        langs[name] = {
            // key: string
            add: function(data) {
                for(var key in data) {
                    this[key] = data[key];
                    if(!langs._[key]) {
                        langs._[key] = data[key];
                    }
                }
                return this;
            },
            set: function() {
                NS.switchLanguage(name);
                return this;
            }
        };
    }
    return langs[name];
};

NS.str = function(key) {
    var k = langs[NS.currentLanguage][key];
    if(!k) {
        if(langs["_"][key]) return langs["_"][key];
        return "@.@";
    }
    else return k;
};

NS.switchLanguage = function(name) {
    NS.currentLanguage = name;
    $("*[i18n]").each(function() {
        var key = $(this).attr("i18n");
        $(this).html(NS.str(key));
    });
};

NS.language("_");
NS.language("en");
NS.language("zh");
NS.currentLanguage = "en";

NS.getTemplate = function(template_name) {
    var ht = $("#" + template_name + "-" + NS.currentLanguage).html();
    if(ht) return ht;
    //console.log("Warning: template '" + template_name + "-" + NS.currentLanguage + "' not found.");
    return $("#" + template_name).html();
};
NS.render = function(template_name, object) {
    var template = NS.getTemplate(template_name);
    if(template) {
        template = template.replace(/\{\> *([0-9a-zA-Z\-\_\.]+) *\<\}/g, function(g, a) {
            return '<span i18n="' + a + '">' + NS.str(a) + '</span>';
        });
        return Mustache.render(template, object);
    }
    return "";
};

NS.Vector = function(x, y) {
    if(!x) x = 0;
    if(!y) y = 0;
    this.x = x;
    this.y = y;
};
NS.Vector.prototype = {
    add: function(v) {
        return new NS.Vector(v.x + this.x, v.y + this.y);
    },
    sub: function(v) {
        return new NS.Vector(this.x - v.x, this.y - v.y);
    },
    scale: function(s) {
        return new NS.Vector(this.x * s, this.y * s);
    },
    length: function() { return Math.sqrt(this.x * this.x + this.y * this.y); },
    normalize: function() {
        var l = this.length();
        return new NS.Vector(this.x / l, this.y / l);
    },
    rotate: function(angle) {
        return new NS.Vector(this.x * Math.cos(angle) - this.y * Math.sin(angle),
                             this.x * Math.sin(angle) + this.y * Math.cos(angle));
    },
    rotate90: function() {
        return new NS.Vector(-this.y, this.x);
    }
};

NS.array_unique = function(array) {
    var a = [];
    var l = array.length;
    for(var i = 0; i < l; i++) {
        var found = false;
        for(var j = i + 1; j < l; j++) {
            if(array[i] === array[j]) {
                found = true;
                break;
            }
        }
        if(!found) a.push(array[i]);
    }
    return a;
};

return NS;

})(); // main nested function.
