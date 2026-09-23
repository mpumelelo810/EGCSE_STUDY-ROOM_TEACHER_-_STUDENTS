/* Original parameterised practice. No API, network call or embedded exam text. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.QuestionBank=api;
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const round=(x,dp=3)=>Number(x.toFixed(dp));
 const fmt=x=>Number.isInteger(x)?String(x):String(round(x,4));
 function rng(seed){let s=seed>>>0||1;return (lo,hi)=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return lo+Math.floor(((t^t>>>14)>>>0)/4294967296*(hi-lo+1));};}
 const step=(title,text,resource)=>({title,text,resource});
 const num=(question,answer,steps,unit='',tolerance=0.001)=>({type:'number',question,answer,display:fmt(answer)+(unit?' '+unit:''),steps,unit,tolerance,hint:steps[0].text});
 function choice(question,answer,options,reason,resource){
  return {type:'choice',question,answer,display:answer,options:[...new Set([answer,...options])],steps:[
   step('Identify the evidence',question,resource),step('Apply the concept',reason,resource),step('State the conclusion',answer)
  ],hint:reason.split('.')[0]+'.'};
 }
 function pool(r,cases,resource){const [q,a,options,why]=cases[r(0,cases.length-1)];return choice(q,a,options,why,resource);}
 const generators={
 M01(r){const start=r(2,15),d=r(2,8),n=r(5,14);return num(`A sequence begins ${start}, ${start+d}, ${start+2*d}, … and continues with a constant difference. Find term ${n}.`,start+(n-1)*d,[step('Find the change',`Each new term adds ${d}.`),step('Count the moves',`From term 1 to term ${n}, there are ${n-1} moves.`),step('Add the increments',`${start} + ${n-1} × ${d} = ${start+(n-1)*d}.`)]);},
 M02(r){let value=r(10001,99999)/1000;const answer=round(value,2);return num(`Round ${value.toFixed(3)} to two decimal places.`,answer,[step('Locate the place','Keep two digits after the decimal point.'),step('Inspect the next digit',`The third decimal digit is ${String(value.toFixed(3)).at(-1)}; round up if it is 5 or more.`),step('Write the result',`${answer.toFixed(2)} (two decimal places).`)],'',0.00001);},
 M03(r){const a=r(1,7),b=r(2,9),c=r(1,7),d=r(2,9);return num(`Calculate \\(\\frac{${a}}{${b}}+\\frac{${c}}{${d}}\\). Give a fraction or a decimal to at least 3 decimal places.`,a/b+c/d,[step('Choose a common denominator',`Use ${b*d}.`,'fractions'),step('Rewrite the fractions',`The numerators become ${a*d} and ${c*b}.`),step('Add',`The result is ${a*d+c*b}/${b*d}, approximately ${fmt(a/b+c/d)}.`)]);},
 M04(r){const old=r(10,40)*10,p=r(2,15)*5,newV=old*(1+p/100);return num(`A school club's membership rises from ${old} to ${fmt(newV)}. Find the percentage increase.`,p,[step('Find the increase',`${fmt(newV)} − ${old} = ${fmt(newV-old)}.`),step('Divide by the original',`${fmt(newV-old)}/${old} = ${p/100}.`,'percent'),step('Convert to a percentage',`${p/100} × 100 = ${p}%.`)],'%');},
 M05(r){const P=r(5,40)*100,p=r(2,9),months=r(2,8)*6,t=months/12,a=P*p/100*t;return num(`E${P} earns simple interest at ${p}% per year for ${months} months. Find the interest earned, in emalangeni.`,a,[step('Match the units',`${months} months = ${t} years and ${p}% = ${p/100}.`,'percent'),step('Use simple interest','Interest = principal × annual decimal rate × years.'),step('Substitute',`${P} × ${p/100} × ${t} = E${a.toFixed(2)}.`)],'E',0.005);},
 M06(r){const a=r(2,7),b=r(2,9),part=r(10,70),total=(a+b)*part;return num(`Share E${total} in the ratio ${a}:${b}. What is the first share, in emalangeni?`,a*part,[step('Count the parts',`${a} + ${b} = ${a+b}.`),step('Find one part',`${total} ÷ ${a+b} = ${part}.`,'fractions'),step('Scale the first share',`${a} × ${part} = E${a*part}.`)],'E');},
 M07(r){const a=r(2,5),m=r(2,5),n=r(1,4);return num(`Write \\(${a}^{${m}}\\times ${a}^{${n}}\\) as one power of ${a}. Enter only the exponent.`,m+n,[step('Check the bases',`Both bases are ${a}.`),step('Use the product rule','For powers of the same base being multiplied, add the exponents.'),step('Add',`${m} + ${n} = ${m+n}, so the expression is ${a}^${m+n}.`)]);},
 M08(r){const coeff=r(11,99)/10,n=-r(2,6),v=coeff*10**n;return num(`Write ${v.toFixed(-n+1)} in standard form \\(${coeff}\\times10^n\\). Find n.`,n,[step('Normalise the coefficient',`The coefficient ${coeff} is between 1 and 10.`),step('Count decimal places',`Move the decimal ${-n} places right to get ${coeff}.`),step('Choose the sign',`The original number is smaller, so the exponent is ${n}.`)]);},
 M09(r){const n=r(3,12);return num(`Find each interior angle of a regular ${n}-sided polygon. Give your answer to 2 decimal places if needed.`,(n-2)*180/n,[step('Find the total',`(${n} − 2) × 180° = ${(n-2)*180}°.`),step('Use regularity',`All ${n} interior angles are equal.`),step('Divide',`${(n-2)*180} ÷ ${n} = ${fmt((n-2)*180/n)}°.`)],'°',0.006);},
 M10(r){const a=r(3,9),b=r(3,9),valid=r(0,1)===1,c=valid?Math.max(a,b):a+b+r(0,4);return choice(`A ruler-and-compasses triangle is proposed with side lengths ${a} cm, ${b} cm and ${c} cm. Can these make a non-flat triangle?`,valid?'Yes':'No',['Yes','No'],`Compare the largest side to the sum of the other two. Every pair must sum to more than the remaining side. Here ${[a,b,c].sort((x,y)=>x-y).slice(0,2).join(' + ')} ${valid?'>':'≤'} ${Math.max(a,b,c)}, so ${valid?'two arcs can meet away from the baseline':'no non-flat triangle exists'}.`,'construction');},
 M11(r){const x=r(-8,8),y=r(-8,8),a=r(2,7),b=r(-7,-1);return num(`Point A(${x}, ${y}) is translated by vector (${a}, ${b}). Find the x-coordinate of its image.`,x+a,[step('Read the vector',`Move ${a} units right and ${-b} units down.`),step('Update x',`${x} + ${a} = ${x+a}.`),step('Check the full point',`The image is (${x+a}, ${y+b}); the requested x-coordinate is ${x+a}.`)],'',0.00001);},
 M12(r){const l=r(3,12),w=r(2,9),h=r(2,10),v=l*w*h;return num(`A cuboid has length ${l} cm, width ${w} cm and volume ${v} cm³. Find its height.`,h,[step('Select the model','A cuboid has volume = length × width × height.'),step('Rearrange',`Height = ${v}/(${l} × ${w}).`,'algebra-video'),step('Calculate',`Height = ${h} cm. Checking: ${l} × ${w} × ${h} = ${v} cm³.`)],'cm');},
 M13(r){const opp=r(3,14),adj=r(3,18),angle=Math.atan(opp/adj)*180/Math.PI;return num(`In a right triangle, relative to angle θ, the opposite side is ${opp} cm and adjacent side is ${adj} cm. Find θ to one decimal place.`,angle,[step('Choose the ratio',`tan θ = opposite/adjacent = ${opp}/${adj}.`,'trig'),step('Use inverse tangent','Set your calculator to degrees and use tan⁻¹.'),step('Round at the end',`θ = ${angle.toFixed(1)}°.`)],'°',0.051);},
 M14(r){const b=r(0,359),ans=(b+180)%360;const q=num(`The bearing of B from A is ${String(b).padStart(3,'0')}°. Find the bearing of A from B.`,ans,[step('Reverse direction','The reverse direction differs by 180°.'),step('Adjust into one full turn',`${b} + 180 = ${b+180}°. ${b+180>=360?'Subtract 360°.':'This is already less than 360°.'}`),step('Use three digits',`The bearing is ${String(ans).padStart(3,'0')}°.`)],'°');q.display=String(ans).padStart(3,'0')+'°';return q;},
 M15(r){const t=r(2,8)/2,v=r(3,12)*10,d=t*v;return num(`A straight section of a distance-time graph rises by ${d} km over ${t} hours. Find the speed during that section.`,v,[step('Read changes, not coordinates',`Distance change = ${d} km; time change = ${t} h.`),step('Calculate gradient',`Speed = ${d}/${t}.`,'coordinates'),step('State units',`${v} km/h.`)],'km/h');},
 M16(r){const k=r(1,9),x=3*k,y=4*k;return num(`Find the magnitude of vector (${x}, −${y}).`,5*k,[step('Identify perpendicular components',`The component lengths are ${x} and ${y}.`),step('Apply Pythagoras',`Magnitude = √(${x}² + (−${y})²).`,'pythagoras'),step('Take the positive root',`√${x*x+y*y} = ${5*k}.`)]);},
 M17(r){const a=r(2,9),b=r(2,9),x=r(2,12);return num(`Evaluate ${a}(x + ${b}) when x = ${x}.`,a*(x+b),[step('Substitute',`${a}(${x} + ${b}).`,'algebra-video'),step('Calculate inside brackets',`${x} + ${b} = ${x+b}.`),step('Multiply',`${a} × ${x+b} = ${a*(x+b)}.`)]);},
 M18(r){const m=r(-7,7)||2,c=r(-9,9),x1=r(-4,2),x2=x1+r(1,7),y1=m*x1+c,y2=m*x2+c;return num(`Find the gradient of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,m,[step('Find the vertical change',`${y2} − (${y1}) = ${y2-y1}.`),step('Find the horizontal change',`${x2} − (${x1}) = ${x2-x1}.`),step('Divide the changes',`${y2-y1}/${x2-x1} = ${m}.`,'coordinates')]);},
 M19(r){const a=r(1,5),n=r(2,3),b=r(1,8),x=r(-3,4),ans=a*n*x**(n-1)+b;return num(`For \\(y=${a}x^{${n}}+${b}x-7\\), find the gradient at x = ${x}.`,ans,[step('Differentiate term by term',`\\(y'=${a*n}x^{${n-1}}+${b}\\). The constant contributes zero.`,'derivative'),step('Substitute into the derivative',`\\(${a*n}(${x})^{${n-1}}+${b}\\).`),step('Calculate the gradient',`The gradient is ${ans}.`)]);},
 M20(r){const a=r(2,9),b=r(-12,12),x=r(-8,12),c=a*x+b;return num(`Solve \\(${a}x ${b<0?'-':'+'} ${Math.abs(b)}=${c}\\).`,x,[step('Isolate the variable term',`Subtract ${b} from each side: ${a}x = ${c-b}.`,'algebra-video'),step('Divide both sides',`x = ${c-b}/${a} = ${x}.`),step('Check',`${a} × (${x}) + (${b}) = ${c}.`)]);},
 M21(r){const a=r(1,6),b=r(1,6),c=r(1,6),d=r(1,6),x=r(1,8),y=r(1,8);return num(`Multiply \\(\\begin{pmatrix}${a}&${b}\\\\${c}&${d}\\end{pmatrix}\\binom{${x}}{${y}}\\). Enter the top entry of the resulting column vector.`,a*x+b*y,[step('Check dimensions','A 2×2 matrix times a 2×1 vector produces a 2×1 vector.'),step('Use the first row',`${a} × ${x} + ${b} × ${y} = ${a*x+b*y}.`,'matrices'),step('Check the whole result',`Top entry = ${a*x+b*y}; bottom entry = ${c*x+d*y}.`)]);},
 M22(r){const x=r(2,12),limit=x+r(3,20);return num(`A region satisfies x ≥ 0, y ≥ 0 and x + y ≤ ${limit}. At x = ${x}, what is the greatest allowed value of y?`,limit-x,[step('Substitute the fixed x',`${x} + y ≤ ${limit}.`),step('Rearrange',`y ≤ ${limit} − ${x} = ${limit-x}.`,'algebra-video'),step('Include the boundary',`The sign is ≤, so y = ${limit-x} is allowed.`)]);},
 M23(r){const values=Array.from({length:5},()=>r(1,20)),sum=values.reduce((a,b)=>a+b,0);return num(`Find the arithmetic mean of ${values.join(', ')}.`,sum/5,[step('Add all observations',`${values.join(' + ')} = ${sum}.`),step('Count observations','There are 5 values, including any repeated ones.'),step('Divide',`${sum}/5 = ${sum/5}.`,'statistics')]);},
 M24(r){const red=r(2,12),blue=r(2,12);return num(`A bag contains ${red} red counters and ${blue} blue counters. Each is equally likely to be selected. Find the probability of drawing red. Give a fraction or decimal to at least 3 decimal places.`,red/(red+blue),[step('Count favourable outcomes',`${red} counters are red.`),step('Count every possible outcome',`${red} + ${blue} = ${red+blue}.`),step('Divide',`P(red) = ${red}/${red+blue} ≈ ${fmt(red/(red+blue))}.`,'probability')]);},
 C01(r){const start=r(1,60)/10,volume=r(100,350)/10,end=round(start+volume,1);return num(`A burette's initial reading is ${start.toFixed(1)} cm³ and final reading is ${end.toFixed(1)} cm³. Calculate the volume delivered.`,volume,[step('Identify the readings',`Initial = ${start.toFixed(1)} cm³; final = ${end.toFixed(1)} cm³.`,'measurement'),step('Subtract in the correct order','Delivered volume = final − initial.'),step('Calculate',`${end.toFixed(1)} − ${start.toFixed(1)} = ${volume.toFixed(1)} cm³.`)],'cm³');},
 C02(r){return pool(r,[
 ['Particles vibrate around fixed positions. Which state is described?','Solid',['Liquid','Gas'],'Fixed positions explain a definite shape.',''],
 ['Particles are close together but slide past one another. Which state is described?','Liquid',['Solid','Gas'],'Close particles that can rearrange give a fixed volume but a changeable shape.'],
 ['Particles are widely separated and move randomly. Which state is described?','Gas',['Solid','Liquid'],'Large spaces allow compression and unrestricted motion allows filling the container.'],
 ['Which process changes a liquid to a solid?','Freezing',['Melting','Condensation'],'Cooling reduces particle energy and allows a fixed arrangement to form.'],
 ['Which process changes a gas to a liquid?','Condensation',['Evaporation','Sublimation'],'Particles come closer together as energy is transferred from the gas.']
 ],'particles');},
 C03(r){return pool(r,[
 ['A sample contains only oxygen molecules, O₂. Classify it.','Element',['Compound','Mixture'],'There is only one kind of atom, even though each molecule contains two atoms.'],
 ['A sample contains only carbon dioxide molecules, CO₂. Classify it.','Compound',['Element','Mixture'],'Different elements are chemically bonded in a fixed ratio.'],
 ['A sample contains separate nitrogen and oxygen molecules. Classify it.','Mixture',['Element','Compound'],'Two substances are present together without a single fixed chemical formula.'],
 ['A sample contains pure sodium chloride. Classify it.','Compound',['Element','Mixture'],'Sodium and chlorine are joined in a fixed ionic ratio.']
 ],'matter');},
 C04(r){return pool(r,[
 ['Choose a method to remove insoluble sand from water.','Filtration',['Simple distillation','Chromatography'],'The solid is trapped as residue while water passes through the filter.'],
 ['Choose a method to collect pure water from salt water.','Simple distillation',['Filtration','Separating funnel'],'Water vaporises and is condensed; the dissolved salt remains behind.'],
 ['Choose a method to separate two immiscible liquids.','Separating funnel',['Crystallisation','Filtration'],'The liquids form separate layers which can be drained apart.'],
 ['Choose a method to separate soluble coloured dyes in an ink.','Chromatography',['Filtration','Separating funnel'],'Dyes move different distances because their interactions with the phases differ.']
 ],'matter');},
 C05(r){return pool(r,[
 ['Ice melts to liquid water. Classify the change.','Physical',['Chemical'],'The substance remains H₂O; arrangement and motion change.'],
 ['Magnesium burns to form magnesium oxide. Classify the change.','Chemical',['Physical'],'A new compound forms when magnesium combines with oxygen.'],
 ['Water boils to steam. Classify the change.','Physical',['Chemical'],'The molecules remain water molecules in a different state.'],
 ['Iron rusts in damp air. Classify the change.','Chemical',['Physical'],'New iron-containing compounds form through reaction.']
 ],'matter');},
 C06(r){const atoms=[['lithium',3,'2,1',1],['carbon',6,'2,4',4],['oxygen',8,'2,6',6],['sodium',11,'2,8,1',1],['magnesium',12,'2,8,2',2],['chlorine',17,'2,8,7',7]],a=atoms[r(0,atoms.length-1)];return num(`A neutral ${a[0]} atom has proton number ${a[1]}. How many electrons are in its outer shell? Use the first-20-elements shell model.`,a[3],[step('Count electrons',`A neutral atom has ${a[1]} electrons.`,'atom'),step('Fill the shells',`The arrangement is ${a[2]}.`),step('Read the outer shell',`The outer shell contains ${a[3]} electrons.`)]);},
 C07(r){const atoms=[['carbon',6,12],['nitrogen',7,14],['oxygen',8,16],['sodium',11,23],['chlorine',17,35]],a=atoms[r(0,atoms.length-1)],isotope=a[2]+r(0,2);return num(`A ${a[0]} isotope has proton number ${a[1]} and nucleon number ${isotope}. Find its neutron number.`,isotope-a[1],[step('Identify what each number counts','Nucleons = protons + neutrons.'),step('Rearrange',`Neutrons = ${isotope} − ${a[1]}.`,'atom'),step('Calculate',`There are ${isotope-a[1]} neutrons.`)]);},
 C08(r){const mol=r(1,15)/10,mass=round(160*mol,1);return num(`A sample contains ${mass} g of CuSO₄. Calculate its amount in moles. Use Cu=64, S=32, O=16.`,mol,[step('Find molar mass','64 + 32 + 4×16 = 160 g/mol.'),step('Use mass divided by molar mass',`n = ${mass}/160.`,'moles'),step('State the amount',`n = ${mol} mol.`)],'mol');},
 C09(r){const mass=r(10,50)*5,change=r(2,18),c=4.2,energy=mass*change*c;return num(`A reaction warms ${mass} g of water by ${change} °C. Estimate the energy transferred to the water using c = 4.2 J/(g °C).`,energy,[step('Identify quantities',`m = ${mass} g, c = 4.2 J/(g °C), ΔT = ${change} °C.`),step('Use Q = mcΔT',`Q = ${mass} × 4.2 × ${change}.`,'thermal'),step('Calculate',`Q = ${fmt(energy)} J. Heat losses mean this may be less than the total reaction energy.`)],'J');},
 C10(r){const p=r(1,13);return choice(`An aqueous sample has pH ${p} near room temperature. Classify it.`,p<7?'Acidic':p>7?'Alkaline':'Neutral',['Acidic','Neutral','Alkaline'],`Compare ${p} with 7. Below 7 is acidic, above 7 is alkaline and 7 is neutral.`,'acids');},
 C11(r){const metals=['magnesium','zinc','iron','copper'],i=r(0,3),j=(i+r(1,3))%4;return choice(`Use the order magnesium > zinc > iron > copper (decreasing reactivity). Can ${metals[i]} displace ${metals[j]} from its salt solution?`,i<j?'Yes':'No',['Yes','No'],`${metals[i]} is ${i<j?'above':'below'} ${metals[j]} in the supplied order. Only a more reactive metal can displace a less reactive one.`,'reactions');},
 C12(r){const items=[['molten lead(II) bromide','Lead','Bromine'],['molten sodium chloride','Sodium','Chlorine'],['molten magnesium chloride','Magnesium','Chlorine']],a=items[r(0,2)],cath=r(0,1)===1;return choice(`During electrolysis of ${a[0]} with inert electrodes, what forms at the ${cath?'cathode':'anode'}?`,a[cath?1:2],[a[1],a[2],'Hydrogen'],cath?'Positive metal ions move to the cathode and gain electrons, producing the metal.':'Negative non-metal ions move to the anode and lose electrons, producing the non-metal.','electrolysis');},
 C13(r){return pool(r,[
 ['Which gas is the largest component of clean, dry air?','Nitrogen',['Oxygen','Carbon dioxide'],'Nitrogen makes up about 78% of dry air by volume.'],
 ['Which gas relights a glowing splint in the standard test?','Oxygen',['Hydrogen','Carbon dioxide'],'Oxygen supports combustion, allowing the glowing splint to relight.'],
 ['Which gas turns limewater milky in the standard test?','Carbon dioxide',['Oxygen','Nitrogen'],'Carbon dioxide reacts to produce a suspended calcium carbonate precipitate.'],
 ['Which gas is combined with nitrogen in the Haber process?','Hydrogen',['Oxygen','Chlorine'],'The balanced equation N₂ + 3H₂ ⇌ 2NH₃ shows that hydrogen is the other reactant.']
 ],'matter');},
 C14(r){const n=r(2,10),alkene=r(0,1)===1,h=2*n+(alkene?0:2);return num(`An acyclic ${alkene?'alkene with one C=C double bond':'alkane'} contains ${n} carbon atoms. How many hydrogen atoms does each molecule contain?`,h,[step('Choose the general formula',alkene?'CₙH₂ₙ for this alkene family.':'CₙH₂ₙ₊₂ for alkanes.','organic'),step('Substitute n',`n = ${n}; H count = 2 × ${n}${alkene?'':' + 2'}.`),step('Write the formula',`C${n}H${h}; there are ${h} hydrogen atoms.`)]);},
 P01(r){const volume=r(2,20)*5,density=r(2,15)/2,mass=volume*density;return num(`A solid has mass ${mass} g and volume ${volume} cm³. Calculate its density.`,density,[step('Use compatible units','Mass is in grams and volume in cubic centimetres.'),step('Apply the definition',`Density = ${mass}/${volume}.`,'measurement'),step('State units',`${density} g/cm³.`)],'g/cm³');},
 P02(r){const u=r(0,10),t=r(2,8),a=r(1,5),v=u+a*t;return num(`A trolley's velocity rises uniformly from ${u} m/s to ${v} m/s in ${t} s along a straight line. Find its acceleration.`,a,[step('Find velocity change',`${v} − ${u} = ${v-u} m/s.`),step('Divide by elapsed time',`a = ${v-u}/${t}.`,'motion'),step('State the acceleration',`${a} m/s².`)],'m/s²');},
 P03(r){const force=r(2,15)*10,d=r(2,12)/10,ans=force*d;return num(`A force of ${force} N acts with perpendicular distance ${d} m from a pivot. Find the magnitude of its moment.`,ans,[step('Check the distance',`The given ${d} m is perpendicular to the force's line of action.`),step('Use force × perpendicular distance',`Moment = ${force} × ${d}.`,'forces'),step('State units',`${fmt(ans)} N m.`)],'N m');},
 P04(r){const m=r(2,15),h=r(2,20),g=10;return num(`A ${m} kg object is lifted vertically through ${h} m. Find its gain in gravitational potential energy. Use g = 10 N/kg.`,m*g*h,[step('Identify the vertical rise',`m = ${m} kg; h = ${h} m; g = 10 N/kg.`),step('Use Eₚ = mgh',`Eₚ = ${m} × 10 × ${h}.`,'energy'),step('Calculate',`The gain is ${m*g*h} J.`)],'J');},
 P05(r){const f=r(2,12),w=r(2,20)/10;return num(`A wave has frequency ${f} Hz and wavelength ${w} m. Find its speed.`,f*w,[step('Identify the measurements',`f = ${f} Hz and λ = ${w} m.`),step('Use v = fλ',`v = ${f} × ${w}.`,'waves'),step('Check units',`Speed = ${fmt(f*w)} m/s.`)],'m/s');},
 P06(r){return pool(r,[
 ['Which transfer process can carry thermal energy through a vacuum?','Radiation',['Conduction','Convection'],'Radiation uses electromagnetic waves and needs no material medium.'],
 ['Warmer water rises while cooler water sinks. Which process transfers energy this way?','Convection',['Conduction','Radiation'],'The bulk movement of the fluid carries energy, driven by density differences.'],
 ['A metal spoon warms from the end placed in hot soup. What is the main transfer along the spoon?','Conduction',['Convection','Evaporation'],'Vibrations and mobile electrons transfer energy through the solid.'],
 ['Which surface is generally the best emitter of infrared radiation at the same temperature?','Dull black',['Shiny silver','Polished white'],'Dull dark surfaces emit infrared more effectively than shiny reflective surfaces.']
 ],'thermal');},
 P07(r){return pool(r,[
 ['A neutral plastic rod gains electrons. What charge does it acquire?','Negative',['Positive','Zero'],'Electrons carry negative charge, so adding them creates an excess of negative charge.'],
 ['A neutral object loses electrons. What charge does it acquire?','Positive',['Negative','Zero'],'Removing negative charge leaves an excess of positive charge.'],
 ['Two small objects each have a net negative charge. What electric interaction occurs?','Repulsion',['Attraction','No interaction'],'Like charges repel.'],
 ['Two small objects have opposite non-zero net charges. What interaction occurs?','Attraction',['Repulsion','No interaction'],'Unlike charges attract.']
 ],'static');},
 P08(r){const R=r(2,15),I=r(1,6),V=R*I;return num(`A resistor has ${V} V across it and carries ${I} A. Calculate its resistance.`,R,[step('Select the relationship','V = IR, so R = V/I.'),step('Substitute',`R = ${V}/${I}.`,'circuits'),step('Calculate and check',`R = ${R} Ω; ${I} A × ${R} Ω = ${V} V.`)],'Ω');},
 P09(r){const a=r(2,12),b=r(2,12),series=r(0,1)===1,answer=series?a+b:a*b/(a+b);return num(`Resistors of ${a} Ω and ${b} Ω are connected in ${series?'series':'parallel'}. Find the combined resistance to 3 decimal places if necessary.`,answer,[step('Identify the connection',series?'One current path means series resistances add.':'The two resistors share a voltage: use the parallel rule.','circuits'),step('Substitute',series?`R = ${a} + ${b}.`:`R = (${a} × ${b})/(${a} + ${b}).`),step('Check the size',`R = ${fmt(answer)} Ω, ${series?'greater than either resistor':'less than either resistor'}.`)],'Ω');},
 P10(r){const V=r(2,12)*20,I=r(1,10)/2;return num(`An appliance operates at ${V} V and draws ${I} A. Calculate its electrical power.`,V*I,[step('Select the formula','Power = voltage × current.'),step('Substitute',`P = ${V} × ${I}.`,'circuits'),step('Use watts',`P = ${V*I} W.`)],'W');},
 P11(r){const p=r(0,1)?'north':'south',q=r(0,1)?'north':'south';return choice(`A magnet's ${p} pole faces another magnet's ${q} pole. Do they attract or repel?`,p===q?'Repel':'Attract',['Attract','Repel'],p===q?'The poles are alike, so the interaction is repulsion.':'The poles are unlike, so the interaction is attraction.','magnet');},
 P12(r){const gates=['AND','OR','NAND','NOR'],gate=gates[r(0,3)],a=r(0,1),b=r(0,1),value=gate==='AND'?a&b:gate==='OR'?a|b:gate==='NAND'?1-(a&b):1-(a|b);return num(`A two-input ${gate} gate receives A = ${a} and B = ${b}. Find the output (0 or 1).`,value,[step('Recall the rule',gate.includes('AND')?'AND needs both inputs to be 1.':'OR needs at least one input to be 1.','logic'),step('Apply inversion if needed',gate.startsWith('N')?'Invert the AND/OR result because this is a NAND/NOR gate.':'This gate does not invert its result.'),step('State the output',`For (${a}, ${b}), the output is ${value}.`)],'',0);},
 P13(r){const Np=r(10,30)*100,Ns=r(1,9)*100,Vp=r(10,24)*10,V=Vp*Ns/Np;return num(`An ideal transformer has ${Np} primary turns and ${Ns} secondary turns. Its primary voltage is ${Vp} V a.c. Calculate the secondary voltage to 3 decimal places if necessary.`,V,[step('Use the turns ratio','Vₛ/Vₚ = Nₛ/Nₚ.'),step('Rearrange and substitute',`Vₛ = ${Vp} × ${Ns}/${Np}.`,'magnet'),step('Check step-down behaviour',`Vₛ = ${fmt(V)} V, below the primary voltage because there are fewer secondary turns.`)],'V');},
 P14(r){const n=r(1,5),half=r(2,10),start=2**n*r(20,80),ans=start/2**n;return num(`A sample's background-corrected count rate is ${start} counts/min. Its half-life is ${half} hours. Find the expected count rate after ${half*n} hours.`,ans,[step('Count half-lives',`${half*n}/${half} = ${n}.`),step('Halve repeatedly',`Divide the original rate by 2^${n} = ${2**n}.`,'atom'),step('Calculate',`${start}/${2**n} = ${ans} counts/min.`)],'counts/min');},
 P15(r){return pool(r,[
 ['What type of junction is at the heart of an LED?','Semiconductor p–n junction',['Metal-metal contact','Air gap'],'A p–n junction provides the electron and hole regions needed for LED operation.'],
 ['Which bias normally allows an LED to emit light?','Forward bias',['Reverse bias','No applied voltage'],'A suitable forward voltage allows charge carriers to cross and recombine, releasing light.'],
 ['Which three subpixel colours are commonly combined in a direct-emitting colour display?','Red, green and blue',['Red, yellow and blue','Black, grey and white'],'Controlled amounts of red, green and blue light mix additively to create a range of colours.'],
 ['What happens when electrons and holes recombine in a working LED?','Energy is released as light',['Protons leave the nucleus','New atoms are created'],'Recombination releases energy; the semiconductor determines the photon energies.']
 ],'led');}
 };
 function generate(id,seed=1){
  if(!Object.hasOwn(generators,id))throw new Error('Unknown chapter '+id);
  const r=rng(seed);const q=generators[id](r);
  // Match the precision explicitly requested in the question; retain the
  // unrounded numeric answer for checking intermediate calculations.
  if(id==='M02')q.display=q.answer.toFixed(2);
  if(id==='M05'||id==='M06')q.display='E'+q.answer.toFixed(2);
  if(id==='M09')q.display=q.answer.toFixed(2)+'°';
  if(id==='M13')q.display=q.answer.toFixed(1)+'°';
  if(id==='P09'||id==='P13')q.display=(Number.isInteger(q.answer)?String(q.answer):q.answer.toFixed(3))+' '+q.unit;
  if(q.options){for(let i=q.options.length-1;i>0;i--){const j=r(0,i);[q.options[i],q.options[j]]=[q.options[j],q.options[i]];}}
  return {...q,chapter:id,seed:seed>>>0,origin:'Original practice · not an ECESWA past-paper question'};
 }
 function parseNumber(raw){
  const text=String(raw).trim().replace(/\u2212/g,'-').replace(/,/g,'');
  if(!text||text.length>100)return NaN;
  const pattern=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  const parts=text.split('/').map(s=>s.trim());
  if(parts.length===2&&parts.every(s=>pattern.test(s))&&Number(parts[1])!==0)return Number(parts[0])/Number(parts[1]);
  return pattern.test(text)?Number(text):NaN;
 }
 function check(q,raw){
  if(q.type==='choice')return String(raw)===q.answer;
  const v=parseNumber(raw);return Number.isFinite(v)&&Math.abs(v-q.answer)<=q.tolerance+1e-10;
 }
 function next(id,previousSeed,previousQuestion){
  let seed=previousSeed>>>0,q;
  for(let n=0;n<80;n++){seed=(seed+1)>>>0;q=generate(id,seed);if(q.question!==previousQuestion)return q;}
  throw new Error('Could not produce a different question. Please select another chapter.');
 }
 return {generate,next,check,parseNumber,ids:Object.keys(generators)};
});
