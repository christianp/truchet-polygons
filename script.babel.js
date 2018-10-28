"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var TWO_PI = Math.PI * 2;
var RADIUS = 16;
var draw_mode = 'curves';
var PLACE_DURATION = 300;
var DIE_RATE = 1 / 1000;
var DIE_DURATION = 300;
var SPIN_RATE = 5 / 1000;
var SPIN_DURATION = 3;
var maxN = 16;
var all_truchets;
var radii = {};

for (var n = 4; n < maxN; n += 2) {
  var rawR = 1 / (2 * Math.sin(TWO_PI / n / 2));
  radii[n] = rawR;
}

function inradius(n) {
  return RADIUS * radii[n] * Math.cos(TWO_PI / n / 2);
}

function outradius(n) {
  return RADIUS * radii[n];
}

var tile_ids = {};
var svg = document.getElementById('tiles-svg');
var board = svg.querySelector('#board');
var OUTLINE_COLOUR = 'white';
var OUTLINE_WIDTH = 0.0;
var LINE_WIDTH = 0.1;
var COLOUR_PAIRS = [['black', 'white'], ['#633005', '#e5e133'], ['#1a1db6', '#77c1ba'], ['#03011e', '#5172c5'], ['#481141', '#d69961']];
var placed_tiles = [];

function make_tilings() {
  return {
    '4^4': {
      drx: 4 * inradius(4),
      dry: 0,
      dcx: 2 * inradius(4),
      dcy: 2 * inradius(4),
      tiles: [{
        n: 4,
        m: 0,
        a: 0,
        r: 45
      }, {
        n: 4,
        m: 2 * inradius(4),
        a: 0,
        r: -45
      }]
    },
    '6^3': {
      drx: 2 * inradius(6),
      dry: 0,
      dcx: 4 * inradius(6) - Math.cos(TWO_PI / 6) * 6 * inradius(6),
      dcy: Math.sin(TWO_PI / 6) * 6 * inradius(6),
      tiles: [{
        n: 6,
        m: 0,
        a: 0,
        r: 30
      }, {
        n: 6,
        m: 2 * inradius(6),
        a: TWO_PI / 6,
        r: 30
      }, {
        n: 6,
        m: 2 * inradius(6),
        a: -TWO_PI / 6,
        r: 30
      }]
    },
    '4.6.12': {
      drx: 2 * (inradius(12) + 2 * inradius(6) + inradius(4)),
      dry: 0,
      dcx: Math.cos(TWO_PI / 12) * 2 * (inradius(12) + inradius(4)),
      dcy: Math.sin(TWO_PI / 12) * 2 * (inradius(12) + inradius(4)),
      tiles: [{
        n: 12,
        m: 0,
        a: 0,
        r: 15
      }, {
        n: 6,
        m: inradius(6) + inradius(12),
        a: 0,
        r: 30
      }, {
        n: 4,
        m: inradius(4) + inradius(12),
        a: TWO_PI / 12,
        r: -105
      }, {
        n: 4,
        m: inradius(4) + inradius(12),
        a: -TWO_PI / 12,
        r: 15
      }, {
        n: 6,
        m: inradius(6) + inradius(12),
        a: 2 * TWO_PI / 12,
        r: -30
      }, {
        n: 4,
        m: inradius(4) + inradius(12),
        a: -3 * TWO_PI / 12,
        r: -45
      }]
    },
    '4.8^2': {
      drx: 4 * (inradius(4) + inradius(8)),
      dry: 0,
      dcx: 4 * inradius(8) * Math.cos(TWO_PI / 8),
      dcy: 4 * inradius(8) * Math.sin(TWO_PI / 8),
      tiles: [{
        n: 8,
        m: 0,
        a: 0,
        r: 22.5
      }, {
        n: 4,
        m: inradius(4) + inradius(8),
        a: 0,
        r: -45
      }, {
        n: 4,
        m: 3 * inradius(4) + 3 * inradius(8),
        a: 0,
        r: -45
      }, {
        n: 4,
        m: inradius(4) + inradius(8),
        a: 2 * TWO_PI / 8,
        r: 45
      }, {
        n: 8,
        m: 2 * (inradius(4) + inradius(8)),
        a: 0,
        r: 22.5
      }, {
        n: 8,
        m: 2 * inradius(8),
        a: TWO_PI / 8,
        r: -22.5
      }, {
        n: 8,
        m: 2 * inradius(8),
        a: -TWO_PI / 8,
        r: -22.5
      }, {
        n: 4,
        m: Math.sqrt(5) * (inradius(4) + inradius(8)),
        a: Math.atan2(1, 2),
        r: 45
      }]
    }
  };
}

var TILINGS = make_tilings();

function dp(n) {
  return n.toFixed(5);
}

function choice(l) {
  var i = Math.floor(Math.random() * l.length);
  return l[i];
}

function make_everything() {
  RADIUS = parseFloat(size_input.value);
  draw_mode = mode_select.value;
  board.setAttribute('class', draw_mode);
  change_colours();
  TILINGS = make_tilings();
  var defs = svg.querySelector('defs');
  defs.innerHTML = '';
  all_truchets = [];

  var _loop = function _loop(_n) {
    var truchets = generate_truchets(0, _n, true).concat(generate_truchets(0, _n, false));
    var spins = [];

    for (var i = 0; i < _n; i++) {
      spins.push(i);
    }

    var seen = [];
    truchets = truchets.filter(function (arcs) {
      if (bad_straight(arcs, _n)) {
        return false;
      }

      var tile = canonical_tile(arcs, _n);

      if (spins.every(function (s) {
        return seen.indexOf(tile_signature(tile, s, _n)) == -1;
      })) {
        var sig = tile_signature(tile, 0, _n);
        seen.push(sig);
        return true;
      }
    });
    all_truchets.push({
      n: _n,
      truchets: truchets
    });
  };

  for (var _n = 4; _n < 16; _n += 2) {
    _loop(_n);
  }

  make_svg_tiles();
  change_tiling();
}

var tiling_select = document.getElementById('tiling');
Object.keys(TILINGS).forEach(function (k) {
  var o = document.createElement('option');
  o.setAttribute('value', k);
  o.textContent = k;
  tiling_select.appendChild(o);
});
tiling_select.addEventListener('change', make_everything);
var size_input = document.getElementById('size');
size_input.addEventListener('input', make_everything);
var mode_select = document.getElementById('mode');
mode_select.addEventListener('input', make_everything);
var colours_select = document.getElementById('colours');
COLOUR_PAIRS.forEach(function (k, i) {
  var o = document.createElement('option');
  o.setAttribute('value', i);
  o.textContent = k.join(' ');
  colours_select.appendChild(o);
});
colours_select.addEventListener('change', change_colours);

function change_colours() {
  var _COLOUR_PAIRS$colours = _slicedToArray(COLOUR_PAIRS[colours_select.value], 2),
      col1 = _COLOUR_PAIRS$colours[0],
      col2 = _COLOUR_PAIRS$colours[1];

  document.documentElement.style.setProperty('--col-a', col1);
  document.documentElement.style.setProperty('--col-b', col2);
}

function change_tiling() {
  placed_tiles = [];
  var tiling = tiling_select.value;
  var s = new Date();
  apply_tiling(TILINGS[tiling], -100, -100, 100, 100);
  var e = new Date();
}

function poisson(r) {
  var L = Math.exp(-r);
  var k = 0;
  var p = 1;

  while (p > L) {
    p *= Math.random();
    k += 1;
  }

  return k - 1;
}

var ot = new Date();

function die_tile(tile, i) {
  var el = tile.el,
      t = tile.t,
      x = tile.x,
      y = tile.y,
      n = tile.n,
      r = tile.r,
      animating = tile.animating;

  if (animating) {
    return;
  }

  var shrink = t.animate([{
    transform: 'scale(1)'
  }, {
    transform: 'scale(0)'
  }], {
    duration: DIE_DURATION,
    fill: 'both',
    easing: 'ease-in'
  });
  tile.animating = true;

  shrink.onfinish = function () {
    board.removeChild(el);
    place(random_tile(n), x, y, n, r, false);
    placed_tiles.splice(i, 1);
  };
}

function spin_tile(tile) {
  var el = tile.el,
      t = tile.t,
      x = tile.x,
      y = tile.y,
      n = tile.n,
      r = tile.r,
      spin = tile.spin,
      animating = tile.animating;

  if (animating) {
    return;
  }

  tile.animating = true;
  t.removeAttribute('transform');
  var dspin = rand(0, 360, 720 / n);
  var nspin = spin + dspin;
  var scale = 1; //inradius(n)/outradius(n);

  var anim = t.animate([{
    offset: 0,
    transform: "scale(1) rotate(".concat(spin, "deg)")
  }, {
    offset: 0.1,
    transform: "scale(".concat(scale, ") rotate(").concat(spin, "deg)")
  }, {
    offset: 0.9,
    transform: "scale(".concat(scale, ") rotate(").concat(nspin, "deg)")
  }, {
    offset: 1,
    transform: "scale(1) rotate(".concat(nspin, "deg)")
  }], {
    duration: SPIN_DURATION * dspin,
    fill: 'forwards',
    easing: 'ease-in-out'
  });
  board.appendChild(el);

  anim.onfinish = function () {
    tile.animating = false;
  };

  tile.spin = nspin;
}

function frame() {
  var t = new Date();
  var dt = t - ot;
  var dn = poisson(DIE_RATE * dt);

  for (var i = 0; placed_tiles.length && i < dn; i++) {
    var i = Math.floor(Math.random() * placed_tiles.length);
    die_tile(placed_tiles[i], i);
  }

  var sn = poisson(SPIN_RATE * dt);

  for (var _i2 = 0; _i2 < sn; _i2++) {
    var _i3 = Math.floor(Math.random() * placed_tiles.length);

    spin_tile(placed_tiles[_i3]);
  }

  ot = t;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

function apply_tiling(tiling, minx, miny, maxx, maxy) {
  board.innerHTML = '';
  var drx = tiling.drx,
      dry = tiling.dry,
      dcx = tiling.dcx,
      dcy = tiling.dcy,
      tiles = tiling.tiles;

  for (var d = 0;; d++) {
    var did = 0;

    for (var x = 0; x <= d; x++) {
      var y = d - x;
      var coords = [[x, y]];
      y != 0 && coords.push([x, -y]);
      x != 0 && coords.push([-x, y]);
      x != 0 && y != 0 && coords.push([-x, -y]);
      coords.forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            x = _ref2[0],
            y = _ref2[1];

        var px = x * drx + y * dcx;
        var py = x * dry + y * dcy;

        if (px + drx >= minx && px - drx <= maxx && py + dcy >= miny && py - dcy <= maxy) {
          did += 1;
          tiles.forEach(function (def) {
            var n = def.n,
                m = def.m,
                a = def.a,
                r = def.r;
            var dx = Math.cos(a) * m;
            var dy = Math.sin(a) * m;
            place(random_tile(n), px + dx, py + dy, n, r);
          });
        }
      });
    }

    if (!did) {
      break;
    }
  }
}

function place(t, x, y, n, r) {
  var fresh = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
  var spin = rand(0, 360, 720 / n);
  var g = svg_element('g', {
    transform: "translate(".concat(x, ",").concat(y, ") rotate(").concat(r, ")")
  });
  g.appendChild(t);
  board.appendChild(g);
  var tile = {
    el: g,
    t: t,
    x: x,
    y: y,
    n: n,
    r: r,
    spin: spin,
    animating: false
  };
  t.setAttribute('data-spin', spin);

  if (!fresh) {
    tile.animating = true;
    var pop = t.animate([{
      transform: "scale(0) rotate(".concat(spin, "deg)")
    }, {
      transform: "scale(1) rotate(".concat(spin, "deg)")
    }], {
      duration: PLACE_DURATION,
      easing: 'ease-out'
    });

    pop.onfinish = function () {
      tile.animating = false;
    };
  }

  t.style.transform = "rotate(".concat(spin, "deg)");
  placed_tiles.push(tile);
  g.addEventListener('click', function () {
    spin_tile(tile);
  });
}

function random_tile(n) {
  var id = choice(tile_ids[n]);
  return tile(id);
}

function tile(id) {
  var g = svg_element('g');
  var el = document.getElementById(id).cloneNode(true); //svg_element('use',{href:'#'+id});

  g.appendChild(el);
  return g;
}

function rand(from, to, step) {
  var i = Math.floor(Math.random() * (to - from) / step);
  return i * step;
}

function make_svg_tiles() {
  var num_tiles = all_truchets.reduce(function (a, b) {
    return a + b.truchets.length;
  }, 0);
  var i = 0;
  var defs = svg.querySelector('defs');
  all_truchets.forEach(function (_ref3) {
    var n = _ref3.n,
        truchets = _ref3.truchets;
    var R = outradius(n);
    var svg_tiles = tile_ids[n] = [];
    truchets.forEach(function (arcs, j) {
      var mode = arcs[0][2];
      arcs = arcs.sort(function (a, b) {
        var da = arcwidth(a);
        var db = arcwidth(b);
        return da > db ? -1 : db > da ? 1 : 0;
      });
      var g = polygon(n, R, mode);
      var id = "tile-".concat(n, "-").concat(j);
      g.setAttribute('id', id);
      arcs.forEach(function (_ref4) {
        var _ref5 = _slicedToArray(_ref4, 3),
            a = _ref5[0],
            b = _ref5[1],
            mode = _ref5[2];

        g.appendChild(truchet(n, R, a, b, mode));
      });
      defs.appendChild(g);
      i += 1;
      svg_tiles.push(id);
    });
  });
}

function generate_truchets(from, to, mode) {
  var o = [];

  var _loop2 = function _loop2(i) {
    var l = [[[from, i, mode]]];

    if (i > from + 1) {
      var lefts = generate_truchets(from + 1, i, !mode);
      var _o = [];
      lefts.forEach(function (t) {
        l.forEach(function (t2) {
          _o.push(t2.concat(t));
        });
      });
      l = _o;
    }

    if (i < to - 1) {
      var rights = generate_truchets(i + 1, to, mode);
      var _o2 = [];
      rights.forEach(function (t) {
        return l.forEach(function (t2) {
          return _o2.push(t2.concat(t));
        });
      });
      l = _o2;
    }

    o = o.concat(l);
  };

  for (var i = from + 1; i < to; i += 2) {
    _loop2(i);
  }

  return o;
}

function polygon(n, r, mode) {
  var path = [];
  path.push("M ".concat(dp(r), " 0"));

  for (var i = 0; i < n; i++) {
    var an = TWO_PI * i / n;
    var x = Math.cos(an) * r,
        y = Math.sin(an) * r;
    path.push("L ".concat(dp(x), " ").concat(dp(y)));
  }

  path.push('z');
  var g = svg_element('g', {
    'class': "polygon ".concat(mode ? 'a' : 'b'),
    'data-n': n
  });
  var p = svg_element('path', {
    d: path.join(' ')
  });
  g.appendChild(p);
  return g;
}

function svg_element(name, attr, content) {
  var e = document.createElementNS("http://www.w3.org/2000/svg", name);

  if (attr) {
    Object.entries(attr).forEach(function (_ref6) {
      var _ref7 = _slicedToArray(_ref6, 2),
          key = _ref7[0],
          value = _ref7[1];

      return e.setAttribute(key, value);
    });
  }

  if (content) {
    e.innerHTML = content;
  }

  return e;
}

function truchet(n, r, i1, i2, mode) {
  var drawers = {
    'curves': truchet_curve,
    'lines': truchet_line,
    'wedges': truchet_wedge
  };
  return drawers[draw_mode](n, r, i1, i2, mode);
}

function truchet_curve(n, r, i1, i2, mode) {
  var path = [];
  var d = i2 - i1;
  var a1 = TWO_PI * (i1 + .5) / n;
  var a2 = TWO_PI * (i2 + .5) / n;
  var _ref8 = [Math.cos(a1), Math.sin(a1)],
      c1 = _ref8[0],
      s1 = _ref8[1];
  var _ref9 = [Math.cos(a2), Math.sin(a2)],
      c2 = _ref9[0],
      s2 = _ref9[1];
  var w = c1 * s2 - s1 * c2;
  var R = r * Math.cos(Math.PI / n);
  var straight = d == 0 || 2 * d == n;
  var x1 = R * c1,
      y1 = R * s1;
  var x2, y2;
  path.push("M ".concat(dp(x1), " ").concat(dp(y1)));

  for (var i = i1 + 1; i <= i2; i++) {
    var a = TWO_PI * i / n;
    x2 = r * Math.cos(a);
    y2 = r * Math.sin(a);
    path.push("L ".concat(dp(x2), " ").concat(dp(y2)));
  }

  x2 = R * c2;
  y2 = R * s2;
  path.push("L ".concat(dp(x2), " ").concat(dp(y2)));

  if (straight) {
    var _x = R * c1,
        _y = R * s1;

    path.push("L ".concat(dp(_x), " ").concat(dp(_y)));
  } else {
    var x = R * (-s1 + s2) / w,
        y = R * (-c2 + c1) / w;

    var _x2 = R * c1,
        _y2 = R * s1;

    var _x3 = R * c2,
        _y3 = R * s2;

    var aR = 2 * Math.sqrt((_x2 - x) * (_x2 - x) + (_y2 - y) * (_y2 - y));
    path.push("A ".concat(dp(aR / 2), " ").concat(dp(aR / 2), " 0 0 ").concat(2 * d > n ? 0 : 1, " ").concat(dp(_x2), " ").concat(dp(_y2)));
  }

  path.push('z');
  var el = svg_element('path', {
    d: path.join(' '),
    'class': "truchet-curve ".concat(mode ? 'a' : 'b')
  });
  return el;
}

function truchet_line(n, r, i1, i2, mode) {
  if (2 * (i2 - i1) > n) {
    var _ref10 = [i1, i2];
    i2 = _ref10[0];
    i1 = _ref10[1];
    mode = !mode;
  }

  var a1 = TWO_PI * i1 / n;
  var a2 = TWO_PI * (i2 + 1) / n;
  var R = outradius(n);
  var x1 = Math.cos(a1) * R,
      y1 = Math.sin(a1) * R;
  var x2 = Math.cos(a2) * R,
      y2 = Math.sin(a2) * R;
  var d = "M ".concat(dp(x1), " ").concat(dp(y1), " C 0 0 0 0 ").concat(dp(x2), " ").concat(dp(y2));
  var el = svg_element('path', {
    d: d,
    'class': "truchet-line ".concat(mode ? 'a' : 'b')
  });
  return el;
}

function truchet_wedge(n, r, i1, i2, mode) {
  var path = [];
  var an = TWO_PI * (i1 + .5) / n;
  var ir = inradius(n);
  var x1 = ir * Math.cos(an),
      y1 = ir * Math.sin(an);
  path.push("M ".concat(dp(x1), " ").concat(dp(y1)));

  for (var i = i1 + 1; i <= i2; i++) {
    var _an = TWO_PI * i / n;

    var _x4 = r * Math.cos(_an),
        _y4 = r * Math.sin(_an);

    path.push("L ".concat(dp(_x4), " ").concat(dp(_y4)));
  }

  var an2 = TWO_PI * (i2 + .5) / n;
  var x2 = ir * Math.cos(an2),
      y2 = ir * Math.sin(an2);
  path.push("L ".concat(dp(x2), " ").concat(dp(y2)));
  path.push('z');
  var d = path.join(' ');
  var el = svg_element('path', {
    d: d,
    'data-poo': "".concat(i1, " ").concat(i2),
    'class': "truchet-wedge ".concat(mode ? 'a' : 'b')
  });
  return el;
}

function arcwidth(a) {
  var _a = _slicedToArray(a, 3),
      from = _a[0],
      to = _a[1],
      mode = _a[2];

  var d = to - from;
  return d;
}

function bad_straight(arcs, n) {
  return arcs.find(function (a) {
    return 2 * arcwidth(a) == n && a[2] == false;
  });
}

function canonical_tile(arcs, n) {
  arcs = arcs.map(function (a) {
    if (2 * arcwidth(a) > n) {
      return [a[1], n + a[0], !a[2]];
    } else {
      return a;
    }
  });
  arcs = arcs.sort(function (a, b) {
    a = a[0];
    b = b[0];
    return a > b ? 1 : a < b ? -1 : 0;
  });
  return arcs;
}

function rotate_arc(a, s, n) {
  return [(a[0] + n - s) % n, (a[1] + n - s) % n, a[2]];
}

function tile_signature(arcs, s, n) {
  arcs = arcs.map(function (a) {
    return rotate_arc(a, s, n);
  });
  arcs = arcs.sort(function (a, b) {
    a = a[0];
    b = b[0];
    return a > b ? 1 : a < b ? -1 : 0;
  });
  return JSON.stringify(arcs);
}

make_everything();

function nest_truchet(arcs) {
  arcs = arcs.map(function (a) {
    var _a2 = _slicedToArray(a, 2),
        from = _a2[0],
        to = _a2[1];

    return [from, to, []];
  });
  var out = [];
  arcs = arcs.filter(function (a) {
    var _a3 = _slicedToArray(a, 3),
        from = _a3[0],
        to = _a3[1],
        subs = _a3[2];

    var p = arcs.find(function (_ref11) {
      var _ref12 = _slicedToArray(_ref11, 2),
          f2 = _ref12[0],
          t2 = _ref12[1];

      return from > f2 && to < t2;
    });

    if (p) {
      p[2].push(a);
      return false;
    } else {
      return true;
    }
  });
  arcs = arcs.map(function (_ref13) {
    var _ref14 = _slicedToArray(_ref13, 3),
        from = _ref14[0],
        to = _ref14[1],
        subs = _ref14[2];

    return [from, to, subs.length > 0 ? nest_truchet(subs) : subs];
  });
  arcs = arcs.sort(function (a, b) {
    a = a[0];
    b = b[0];
    return a > b ? 1 : a < b ? -1 : 0;
  });
  return arcs;
}

