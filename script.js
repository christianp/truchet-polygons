const TWO_PI = Math.PI*2;
let RADIUS = 16;
let GAP = 0.1;
let draw_mode = 'curves';

const SCALE = 1;
const [MINX,MINY,MAXX,MAXY] = [-SCALE/2*210,-SCALE/2*297,SCALE*210,SCALE*297];

const PLACE_DURATION = 300;
const DIE_RATE = 1/1000;
const DIE_DURATION = 300;
const SPIN_RATE = 5/1000;
const SPIN_DURATION = 3;

const maxN = 16;

let all_truchets;
const radii = {};
for(let n=4;n<maxN;n+=2) {
    const rawR = 1/(2*Math.sin(TWO_PI/n/2));
    radii[n] = rawR;
}
function inradius(n) {
    return RADIUS*radii[n]*Math.cos(TWO_PI/n/2);
}
function outradius(n) {
    return RADIUS*radii[n];
}
const tile_ids = {};

const svg = document.getElementById('tiles-svg');
const board = svg.querySelector('#board');

const OUTLINE_COLOUR = 'white';
const OUTLINE_WIDTH = 0.0;
const LINE_WIDTH = 0.1;

const COLOUR_PAIRS = [
    ['black','white'],
    ['#633005','#e5e133'],
    ['#1a1db6','#77c1ba'],
    ['#03011e','#5172c5'],
    ['#481141','#d69961'],
]

let placed_tiles = [];

function make_tilings() {
    return {
        '4^4': {
            drx: 4*inradius(4),
            dry: 0,
            dcx: 2*inradius(4),
            dcy: 2*inradius(4),
            tiles: [{n:4,m:0,a:0,r:45},{n:4,m:2*inradius(4),a:0,r:-45}]
        },
        '6^3': {
            drx: 2*inradius(6),
            dry: 0,
            dcx: 4*inradius(6)-Math.cos(TWO_PI/6)*6*inradius(6),
            dcy: Math.sin(TWO_PI/6)*6*inradius(6),
            tiles: [
                {n:6,m:0,a:0,r:30},
                {n:6,m:2*inradius(6),a:TWO_PI/6,r:30},
                {n:6,m:2*inradius(6),a:-TWO_PI/6,r:30},
            ]
        },
        '4.6.12': {
            drx: 2*(inradius(12)+2*inradius(6)+inradius(4)),
            dry: 0,
            dcx: Math.cos(TWO_PI/12)*2*(inradius(12)+inradius(4)),
            dcy: Math.sin(TWO_PI/12)*2*(inradius(12)+inradius(4)),
            tiles: [
                {n:12,m:0,a:0,r:15},
                {n:6,m:inradius(6)+inradius(12),a:0,r:30},
                {n:4,m:inradius(4)+inradius(12),a:TWO_PI/12,r:-105},
                {n:4,m:inradius(4)+inradius(12),a:-TWO_PI/12,r:15},
                {n:6,m:inradius(6)+inradius(12),a:2*TWO_PI/12,r:-30},
                {n:4,m:inradius(4)+inradius(12),a:-3*TWO_PI/12,r:-45},
            ]
        },
        '4.8^2': {
            drx: 4*(inradius(4)+inradius(8)),
            dry: 0,
            dcx: 4*inradius(8)*Math.cos(TWO_PI/8),
            dcy: 4*inradius(8)*Math.sin(TWO_PI/8),
            tiles: [
                {n:8,m:0,a:0,r:22.5},
                {n:4,m:inradius(4)+inradius(8),a:0,r:-45},
                {n:4,m:3*inradius(4)+3*inradius(8),a:0,r:-45},
                {n:4,m:inradius(4)+inradius(8),a:2*TWO_PI/8,r:45},
                {n:8,m:2*(inradius(4)+inradius(8)),a:0,r:22.5},
                {n:8,m:2*inradius(8),a:TWO_PI/8,r:-22.5},
                {n:8,m:2*inradius(8),a:-TWO_PI/8,r:-22.5},
                {n:4,m:Math.sqrt(5)*(inradius(4)+inradius(8)),a:Math.atan2(1,2),r:45},
            ]        
        }
    };
}
let TILINGS = make_tilings();

function dp(n) { return n.toFixed(5); }

function choice(l) {
    const i = Math.floor(Math.random()*l.length);
    return l[i];
}

function make_everything() {
    save_options();
    RADIUS = options['size'];
    GAP = options['gap'];
    draw_mode = 'curves';
    board.setAttribute('class',draw_mode);

    set_colours();

    TILINGS = make_tilings();

    const defs = svg.querySelector('defs');
    defs.innerHTML = '';
    all_truchets = [];

    for(let n=4;n<maxN;n+=2) {
        let truchets = generate_truchets(0,n,true).concat(generate_truchets(0,n,false));
        const spins = [];
        for(let i=0;i<n;i++) {
            spins.push(i);
        }
        const seen = [];
        truchets = truchets.filter(arcs=>{
            if(bad_straight(arcs,n)) {
                return false;
            }
            const tile = canonical_tile(arcs,n);
            if(spins.every(s=>seen.indexOf(tile_signature(tile,s,n))==-1)) {
                const sig = tile_signature(tile,0,n);
                seen.push(sig);
                return true;  
            }
        });
        all_truchets.push({n:n, truchets: truchets});
    }  

    make_svg_tiles();
    change_tiling();
//    update_link();
}
const inputs = [
    {label: 'Size', id: 'size', type: 'range', min: 4, max: 200, value: 60},
    {label: 'Gap', id: 'gap', type: 'range', min:0, max: 1, value: 0.1, step: 0.01},
    {label: 'Colour 1', id: 'colour1', type: 'color', value: '#000000'},
    {label: 'Colour 2', id: 'colour2', type: 'color', value: '#ffffff'},
    {label: 'Outline colour', id: 'outline', type: 'color', value: '#ffffff'},
    {label: 'Outline width', id: 'outlinewidth', type: 'range', min: 0, max: 10, step: 0.01, value: 1},
    {label: 'Line x', id: 'linex', type: 'range', min: 0, max: 2, value: 0.1, step: 0.01},
    {label: 'Line y', id: 'liney', type: 'range', min: 0, max: 2, value: 1.1, step: 0.01},
    {label: 'Fade power', id: 'fadepower', type: 'range', min: 0, max: 2, value: 1, step: 0.01},
    {label: 'Angle', id: 'angle', type: 'range', min: -Math.PI/3, max: Math.PI/3, step: 0.01, value: 0},
];

const options = {};
const options_section = document.getElementById('options');
for(let def of inputs) {
    const span = html_element('span',{'class':'option'});
    const label = html_element('label',{'for':def.id},`${def.label}: `);
    const input = html_element('input',def);
    span.appendChild(label);
    span.appendChild(input);
    options_section.appendChild(span);
    input.addEventListener('input',e=>{
        options[def.id] = input.value;
        if(def.type=='color') {
            set_colours();
        } else {
            debounce_remake();
        }
    });
    options[def.id] = input.value;
    def.input = input;
}

let timeout = null;
function debounce_remake() {
    if(timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(make_everything,100);
}

const option_comment = document.createComment('');
svg.appendChild(option_comment);
function save_options() {
    localStorage.setItem('truchet-options',JSON.stringify(options));
    option_comment.textContent = JSON.stringify(options);
}
function restore_options() {
    const saved_options = localStorage.getItem('truchet-options');
    if(saved_options) {
        Object.assign(options,JSON.parse(saved_options));
        for(let def of inputs) {
            def.input.value = options[def.id];
        }
    }
}
const tiling_select = document.getElementById('tiling');
Object.keys(TILINGS).forEach(k=>{
    const o = document.createElement('option');
    o.setAttribute('value',k);
    o.textContent = k;
    tiling_select.appendChild(o);
});
tiling_select.addEventListener('change',e => {
    options['tiling'] = tiling_select.value;
    make_everything();
});
options['tiling'] = tiling_select.value;

const colours_select = document.getElementById('colours');
COLOUR_PAIRS.forEach((k,i)=>{
    const o = document.createElement('option');
    o.setAttribute('value',i);
    o.textContent = k.join(' ');
    colours_select.appendChild(o);
});
colours_select.addEventListener('change',select_colour_pair);
function select_colour_pair() {
    const [col1,col2] = COLOUR_PAIRS[colours_select.value];
    document.getElementById('colour1').value = col1;
    document.getElementById('colour2').value = col2;
}

function set_colours() {
    document.documentElement.style.setProperty('--col-a',options['colour1']);
    document.documentElement.style.setProperty('--col-b',options['colour2']);
    document.documentElement.style.setProperty('--col-outline',options['outline']);
    document.documentElement.style.setProperty('--width-outline',options['outlinewidth']);

//    update_link();
}

document.getElementById('link').addEventListener('click',function(e) {
    update_link();
});
function update_link() {
    const dsvg = svg.cloneNode(true);
    document.body.appendChild(dsvg);
    const attrs = ['fill','stroke','stroke-linejoin','stroke-width'];
    for(let p of dsvg.querySelectorAll('path')) {
        const s = getComputedStyle(p);
        for(let a of attrs) {
            p.setAttribute(a,s[a]);
        }
    }
    const f = new File([dsvg.outerHTML],`truchet-polygons-${new Date()-0}.svg`,{type:'image/svg+xml'});
    const url = URL.createObjectURL(f);
    document.getElementById('link').setAttribute('href',url);
    document.body.removeChild(dsvg);
}

function change_tiling() {
    placed_tiles = [];
    const tiling = options['tiling'];
    const s = new Date();
    apply_tiling(TILINGS[tiling],MINX,MINY,MAXX,MAXY)
    const e = new Date();
}

function poisson(r) {
    const L = Math.exp(-r);
    let k = 0;
    let p = 1;
    while(p>L) {
        p *= Math.random();
        k += 1;
    }
    return k-1;
}

let ot = new Date();
function die_tile(tile,i) {
    const {el,t,x,y,n,r,animating} = tile;
    if(animating) {
        return;
    }
    const shrink = t.animate([{transform:'scale(1)'},{transform:'scale(0)'}],{duration:DIE_DURATION,fill:'both',easing:'ease-in'});
    tile.animating = true;
    shrink.onfinish = function() {
        board.removeChild(el);
        place(random_tile(n),x,y,n,r,false);
        placed_tiles.splice(i,1);
    };
}
function spin_tile(tile) {
    const {el,t,x,y,n,r,spin,animating} = tile;
    if(animating) {
        return;
    }
    tile.animating = true;
    t.removeAttribute('transform');
    const dspin = rand(0,360,720/n);
    const nspin = spin + dspin;
    const scale = 1;//inradius(n)/outradius(n);
    const anim = t.animate(
        [
            {offset: 0, transform:`scale(1) rotate(${spin}deg)`},
            {offset: 0.1, transform:`scale(${scale}) rotate(${spin}deg)`},
            {offset: 0.9, transform: `scale(${scale}) rotate(${nspin}deg)`},
            {offset: 1, transform: `scale(1) rotate(${nspin}deg)`}
        ],
        {duration:SPIN_DURATION*dspin,fill:'forwards',easing:'ease-in-out'}
    );
    board.appendChild(el);
    anim.onfinish = function() {
        tile.animating = false;
    }
    tile.spin = nspin;

}
function frame() {
    const t = new Date();
    const dt = t-ot;
    const dn = poisson(DIE_RATE*dt);
    for(let i=0;placed_tiles.length && i<dn;i++) {
        const i = Math.floor(Math.random()*placed_tiles.length);
        die_tile(placed_tiles[i],i);
    }
    const sn = poisson(SPIN_RATE*dt);
    for(let i=0;i<sn;i++) {
        const i = Math.floor(Math.random()*placed_tiles.length);
        spin_tile(placed_tiles[i]);
    }
    ot = t;
    requestAnimationFrame(frame);
}
//requestAnimationFrame(frame);


function apply_tiling(tiling,minx,miny,maxx,maxy) {
    const [vw,vh] = [MAXX-MINX, MAXY-MINY];
    svg.setAttribute('viewBox',`${minx} ${miny} ${maxx} ${maxy}`);
    const bg = svg.querySelector('#bg');
    bg.setAttribute('x',minx);
    bg.setAttribute('y',miny);
    bg.setAttribute('width',maxx-minx);
    bg.setAttribute('height',maxy-miny);
    board.innerHTML = '';
    const {drx,dry,dcx,dcy,tiles} = tiling;

    function project(x,y) {
        const an = options['angle'];
        const [c,s] = [Math.cos(an),Math.sin(an)];
        const [px,py] = [x*c - y*s, x*s + y*c];
        return [px, py];
    }
    for(let d=0;;d++) {
        let did = 0;
        for(let x=0;x<=d;x++) {
            const y = d-x;
            const coords = [[x,y]];
            y!=0 && coords.push([x,-y]);
            x!=0 && coords.push([-x,y]);
            x!=0 && y!=0 && coords.push([-x,-y]);
            coords.forEach(([x,y])=>{
                const [px,py] = [x*drx+y*dcx, x*dry+y*dcy];
                tiles.forEach(def=>{
                    const {n,m,a,r} = def;
                    const dx = Math.cos(a)*m;
                    const dy = Math.sin(a)*m;
                    const [rx,ry] = [px+dx-MINX, py+dy-MINY];
                    const [w,h] = [MAXX-MINX, MAXY-MINY];
                    const scale = Math.min(Math.pow(Math.max(0,options['linex']*rx/w+options['liney']*ry/h),options['fadepower']),1);
                    const [x,y] = project(px+dx,py+dy);
                    if(x+drx>=minx && x-drx<=maxx && y+dcy>=miny && y-dcy<=maxy) {
                        did+=1;
                        place(random_tile(n),x,y,n,r+options['angle']*180/Math.PI,scale);
                    }
                });
            });
        }
        if(!did) {
            break;
        }
    }
}

function place(t,x,y,n,r,scale) {
    const spin = rand(0,360,720/n);
    const g = svg_element('g',{transform:`translate(${x},${y}) rotate(${r})`});
    board.appendChild(g);
    g.appendChild(t);
    const tile = {el:g,t,x,y,n,r,spin,animating:false};
    t.setAttribute('data-spin',spin);
    t.setAttribute('transform',`rotate(${spin}) scale(${scale})`);
    placed_tiles.push(tile);
    g.addEventListener('click',function() {
//        spin_tile(tile);
    });
}

function random_tile(n) {
    const id = choice(tile_ids[n]);
    return tile(id);
}
function tile(id) {
    const g = svg_element('g');
    const el = document.getElementById(id).cloneNode(true);//svg_element('use',{href:'#'+id});
    g.appendChild(el);
    return g;
}

function rand(from,to,step) {
    const i = Math.floor(Math.random()*(to-from)/step);
    return i*step;
}

function make_svg_tiles() {
    const num_tiles = all_truchets.reduce((a,b)=>a+b.truchets.length,0);
    let i = 0;
    const defs = svg.querySelector('defs');
    all_truchets.forEach(({n,truchets}) => {
        const svg_tiles = tile_ids[n] = [];
        truchets.forEach((arcs,j)=>{
            const mode = arcs[0][2];
            const g = make_better_tile(arcs,j,n,mode);
            const id = `tile-${n}-${j}`;
            g.setAttribute('id',id);
            defs.appendChild(g);
            i += 1;
            svg_tiles.push(id);
        })
    });
}

function make_better_tile(arcs,j,n,mode) {

    const R = outradius(n) - GAP*outradius(4);
    const g = polygon(n,R,false);
    const g_arcs = g.querySelector('.arcs');

    const seen = {};
    const maps = {};
    for(let [from,to,mode] of arcs) {
        maps[from] = to;
        maps[to] = from;
    }
    // coords of vertex v
    function vertex(v) {
        const an = v/n*TWO_PI;
        const [x,y] = [Math.cos(an), Math.sin(an)];
        return [R*x,R*y];
    }
    // coords of middle of edge between vertex v and v+1
    function middle(v) {
        const [x1,y1] = vertex(v);
        const [x2,y2] = vertex(v+1);
        return [(x1+x2)/2, (y1+y2)/2];
    }

    for(let i=0;i<n;i+=2) {
        if(seen[i]) {
            continue;
        }
        const path = [];
        const visited = [];
        const start = i;
        seen[start] = true;
        let pos = start;
        let [x1,y1] = middle(start); // middle of beginning edge
        path.push(`M ${dp(x1)} ${dp(y1)}`);
        let opos = -1;
        let goes = 0;
        while(opos!=start) {
            goes += 1;
            if(goes>n) {
                throw(new Error("ARG"));
            }
            opos = pos;
            pos = maps[opos];
            visited.push(opos);
            visited.push(pos);
            seen[pos] = true;
            let d = pos - opos;
            if(d<0) {
                d += n;
            }
            const [x2,y2] = middle(pos); // middle of end edge
            const straight = d==0 || 2*d==n;

            if(straight) {
                path.push(`L ${dp(x2)} ${dp(y2)}`);
            } else {
                const exterior = 2*Math.PI/n;
                const interior = Math.PI - exterior;
                const ad = Math.abs(2*d>n ? d-n : d);
                const an = interior - (ad-1)*exterior;
                const dx = Math.sin(ad/n*TWO_PI);
                const aR = inradius(n)*dx/(1-Math.cos(an));
                path.push(`A ${dp(aR)} ${dp(aR)} 0 0 ${2*d>n ? 1 : 0} ${dp(x2)} ${dp(y2)}`);

            }
            const [x3,y3] = vertex(pos+1);
            const [x4,y4] = middle(pos+1);
            path.push(`L ${dp(x3)} ${dp(y3)}`);
            path.push(`L ${dp(x4)} ${dp(y4)}`);
            [x1,y1] = [x4,y4];
            opos = pos = (pos + 1)%n;
            seen[opos] = true;
        }
        const el = svg_element('path',{d:path.join(' '), 'class':'truchet-curve b','data-visited': visited.join(' ')});
        g_arcs.appendChild(el);
    }
    return g;
}

function generate_truchets(from,to,mode) {
    let o = [];
    for(let i=from+1;i<to;i+=2) {
        let l = [[[from,i,mode]]];
        if(i>from+1) {
            const lefts = generate_truchets(from+1,i,!mode);
            const o = [];
            lefts.forEach(t=>{
                l.forEach(t2=>{
                    o.push(t2.concat(t))
                })
            });
            l = o;
        }
        if(i<to-1) {
            const rights = generate_truchets(i+1,to,mode);
            const o = [];
            rights.forEach(t=>l.forEach(t2=>o.push(t2.concat(t))));
            l = o;
        }
        o = o.concat(l);
    }
    return o;
}

function polygon(n,r,mode) {
    const path = [];
    path.push(`M ${dp(r)} 0`);
    for(let i=0;i<n;i++) {
        const an = TWO_PI*i/n;
        const [x,y] = [Math.cos(an)*r,Math.sin(an)*r];
        path.push(`L ${dp(x)} ${dp(y)}`)
    }
    path.push('z');
    const g = svg_element('g',{'class': `polygon ${mode?'a':'b'}`,'data-n':n});
    const background = svg_element('path',{'class':'background', d:path.join(' ')});
    g.appendChild(background);
    const arcs = svg_element('g',{'class':'arcs'});
    g.appendChild(arcs);
    const outline = svg_element('path',{'class':'outline', d:path.join(' ')});
    g.appendChild(outline);
    return g;
}

function html_element(name,attr,content) {
    const e = document.createElement(name);
    if(attr) {
        Object.entries(attr).forEach(([key,value])=>e.setAttribute(key,value));
    }
    if(content) {
        e.innerHTML = content;
    }
    return e;
}

function svg_element(name,attr,content) {
    const e = document.createElementNS("http://www.w3.org/2000/svg",name);
    if(attr) {
        Object.entries(attr).forEach(([key,value])=>e.setAttribute(key,value));
    }
    if(content) {
        e.innerHTML = content;
    }
    return e;
}

function truchet(n,r,i1,i2,mode) {
    const drawers = {
        'curves': truchet_curve,
        'lines': truchet_line,
        'wedges': truchet_wedge
    };
    return drawers[draw_mode](n,r,i1,i2,mode);
}

function truchet_curve(n,r,i1,i2,mode) {
    const path = [];
    const d = i2-i1;
    const a1 = TWO_PI*(i1+.5)/n;
    const a2 = TWO_PI*(i2+.5)/n;
    const [c1,s1] = [Math.cos(a1), Math.sin(a1)];
    const [c2,s2] = [Math.cos(a2), Math.sin(a2)];
    const w = c1*s2 - s1*c2;
    const R = r*Math.cos(Math.PI/n);
    const straight = d==0 || 2*d==n;

    let [x1,y1] = [R*c1,R*s1];
    let x2,y2;
    path.push(`M ${dp(x1)} ${dp(y1)}`);
    for(let i=i1+1;i<=i2;i++) {
        const a = TWO_PI*i/n;
        [x2,y2] = [r*Math.cos(a),r*Math.sin(a)];
        path.push(`L ${dp(x2)} ${dp(y2)}`);
    }
    [x2,y2] = [R*c2,R*s2];
    path.push(`L ${dp(x2)} ${dp(y2)}`);

    if(straight) {
        const [x1,y1] = [R*c1,R*s1];
        path.push(`L ${dp(x1)} ${dp(y1)}`);
    } else {
        const [x,y] = [R*(-s1+s2)/w, R*(-c2+c1)/w];
        const [x1,y1] = [R*c1,R*s1];
        const [x2,y2] = [R*c2,R*s2];
        const aR = 2*Math.sqrt((x1-x)*(x1-x)+(y1-y)*(y1-y));
        path.push(`A ${dp(aR/2)} ${dp(aR/2)} 0 0 ${2*d>n ? 0: 1} ${dp(x1)} ${dp(y1)}`);

    }

    path.push('z');
    const el = svg_element('path',{d:path.join(' '),'class':`truchet-curve ${mode?'a':'b'}`});
    return el;
}

function truchet_line(n,r,i1,i2,mode) {
    if(2*(i2-i1)>n) {
        [i2,i1] = [i1,i2];
        mode = !mode;
    }
    const a1 = TWO_PI*(i1)/n;
    const a2 = TWO_PI*(i2+1)/n;
    const R = outradius(n);
    const [x1,y1] = [Math.cos(a1)*R,Math.sin(a1)*R];
    const [x2,y2] = [Math.cos(a2)*R,Math.sin(a2)*R];
    const d = `M ${dp(x1)} ${dp(y1)} C 0 0 0 0 ${dp(x2)} ${dp(y2)}`;
    const el = svg_element('path',{d,'class':`truchet-line ${mode?'a':'b'}`});
    return el;
}

function truchet_wedge(n,r,i1,i2,mode) {
    const path = [];
    const an = TWO_PI*(i1+.5)/n;
    const ir = inradius(n);
    const [x1,y1] = [ir*Math.cos(an), ir*Math.sin(an)];
    path.push(`M ${dp(x1)} ${dp(y1)}`);
    for(let i=i1+1;i<=i2;i++) {
        const an = TWO_PI*i/n;
        const [x2,y2] = [r*Math.cos(an),r*Math.sin(an)];
        path.push(`L ${dp(x2)} ${dp(y2)}`);
    }
    const an2 = TWO_PI*(i2+.5)/n;
    const [x2,y2] = [ir*Math.cos(an2), ir*Math.sin(an2)];
    path.push(`L ${dp(x2)} ${dp(y2)}`);
    path.push('z');
    const d = path.join(' ');
    const el = svg_element('path',{d,'data-poo': `${i1} ${i2}`, 'class':`truchet-wedge ${mode?'a':'b'}`});
    return el;
}

function arcwidth(a) {
    const [from,to,mode] = a;
    const d = to-from;
    return d;
}
function bad_straight(arcs,n) {
    return arcs.find(a=>{return 2*arcwidth(a)==n && a[2]==false})
}

function canonical_tile(arcs,n) {      
    arcs = arcs.map(a=>{
        if(2*arcwidth(a)>n) {
            return [a[1],n+a[0],!a[2]];
        } else {
            return a;
        }
    });
    arcs = arcs.sort((a,b)=>{a = a[0]; b = b[0]; return a>b ? 1 : a<b ? -1 : 0});
    return arcs;
}
function rotate_arc(a,s,n) {
    return [(a[0]+n-s)%n, (a[1]+n-s)%n, a[2]];
}

function tile_signature(arcs,s,n) {
    arcs = arcs.map(a=>rotate_arc(a,s,n));
    arcs = arcs.sort((a,b)=>{a = a[0]; b = b[0]; return a>b ? 1 : a<b ? -1 : 0});
    return JSON.stringify(arcs);
}

restore_options();
make_everything();


function nest_truchet(arcs) {
    arcs = arcs.map(a=>{
        const [from,to] = a;
        return [from,to,[]];
    });
    const out = [];
    arcs = arcs.filter(a=>{
        const [from,to,subs] = a;
        const p = arcs.find(([f2,t2])=> from>f2 && to<t2 );
        if(p) {
            p[2].push(a);
            return false;
        } else {
            return true;
        }
    });
    arcs = arcs.map(([from,to,subs]) => {
        return [from,to,subs.length>0 ? nest_truchet(subs) : subs];
    });
    arcs = arcs.sort((a,b)=>{a = a[0]; b = b[0]; return a>b ? 1 : a<b ? -1 : 0});
    return arcs;
}
