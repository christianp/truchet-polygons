const TWO_PI = Math.PI*2;
let RADIUS = 16;
let draw_mode = 'curves';

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
    RADIUS = parseFloat(size_input.value);
    draw_mode = mode_select.value;
    board.setAttribute('class',draw_mode);

    change_colours();

    TILINGS = make_tilings();

    const defs = svg.querySelector('defs');
    defs.innerHTML = '';
    all_truchets = [];

    for(let n=4;n<16;n+=2) {
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
}
const tiling_select = document.getElementById('tiling');
Object.keys(TILINGS).forEach(k=>{
    const o = document.createElement('option');
    o.setAttribute('value',k);
    o.textContent = k;
    tiling_select.appendChild(o);
});
tiling_select.addEventListener('change',make_everything);
const size_input = document.getElementById('size');
size_input.addEventListener('input',make_everything);
const mode_select = document.getElementById('mode');
mode_select.addEventListener('input',make_everything);
const colours_select = document.getElementById('colours');
COLOUR_PAIRS.forEach((k,i)=>{
    const o = document.createElement('option');
    o.setAttribute('value',i);
    o.textContent = k.join(' ');
    colours_select.appendChild(o);
});
colours_select.addEventListener('change',change_colours);
function change_colours() {
    const [col1,col2] = COLOUR_PAIRS[colours_select.value];
    document.documentElement.style.setProperty('--col-a',col1);
    document.documentElement.style.setProperty('--col-b',col2);
}

function change_tiling() {
    placed_tiles = [];
    const tiling = tiling_select.value;
    const s = new Date();
    apply_tiling(TILINGS[tiling],-100,-100,100,100)
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
    const dspin = 720/n * (Math.floor((n/2-1)*Math.random()));
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
requestAnimationFrame(frame);


function apply_tiling(tiling,minx,miny,maxx,maxy) {
    board.innerHTML = '';
    const {drx,dry,dcx,dcy,tiles} = tiling;
    for(let d=0;;d++) {
        let did = 0;
        for(let x=0;x<=d;x++) {
            const y = d-x;
            const coords = [[x,y]];
            y!=0 && coords.push([x,-y]);
            x!=0 && coords.push([-x,y]);
            x!=0 && y!=0 && coords.push([-x,-y]);
            coords.forEach(([x,y])=>{
                const px = x*drx+y*dcx;
                const py = x*dry+y*dcy;
                if(px+drx>=minx && px-drx<=maxx && py+dcy>=miny && py-dcy<=maxy) {
                    did+=1;
                    tiles.forEach(def=>{
                        const {n,m,a,r} = def;
                        const dx = Math.cos(a)*m;
                        const dy = Math.sin(a)*m;
                        place(random_tile(n),px+dx,py+dy,n,r);
                    });
                }
            });
        }
        if(!did) {
            break;
        }
    }
}

function place(t,x,y,n,r,fresh=true) {
    const spin = rand(0,360,720/n);
    const g = svg_element('g',{transform:`translate(${x},${y}) rotate(${r})`});
    g.appendChild(t);
    board.appendChild(g);
    const tile = {el:g,t,x,y,n,r,spin,animating:false};
    t.setAttribute('data-spin',spin);
    if(!fresh) {
        tile.animating = true;
        const pop = t.animate([{transform:`scale(0) rotate(${spin}deg)`},{transform:`scale(1) rotate(${spin}deg)`}],{duration:PLACE_DURATION,easing:'ease-out'});
        pop.onfinish = function() {
            tile.animating = false;
        }
    }
    t.style.transform = `rotate(${spin}deg)`;
    placed_tiles.push(tile);
    g.addEventListener('click',function() {
        spin_tile(tile);
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
        const R = outradius(n);
        const svg_tiles = tile_ids[n] = [];
        truchets.forEach((arcs,j)=>{
            const mode = arcs[0][2];
            arcs = arcs.sort((a,b)=>{const da = arcwidth(a); const db = arcwidth(b); return da>db ? -1 : db>da ? 1 : 0});
            const g = polygon(n,R,mode);
            const id = `tile-${n}-${j}`;
            g.setAttribute('id',id);
            arcs.forEach(([a,b,mode])=>{
                g.appendChild(truchet(n,R,a,b,mode));
            });
            defs.appendChild(g);
            i += 1;
            svg_tiles.push(id);
        })
    });
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
    const p = svg_element('path',{d:path.join(' ')});
    g.appendChild(p);
    return g;
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
    switch(draw_mode) {
        case 'curves':
            return truchet_curve(n,r,i1,i2,mode);
        case 'lines':
            return truchet_line(n,r,i1,i2,mode);
    }
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

make_everything();
