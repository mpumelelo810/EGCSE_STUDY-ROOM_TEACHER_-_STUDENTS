"""Original revision guides mapped to ECESWA's 2024–2026 topic headings.

The exam PDFs stay with their publisher. References identify questions for
students to open; generated exercises are original, not ECESWA questions.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = "https://www.khanyisa.online/educare/"
SYLLABUS = {
    "maths": BASE+"syllabus/form5/EGCSE%206880%20Syllabus%20-%20Mathematics%202024%20-2026-1657607285.pdf",
    "science": BASE+"syllabus/form5/EGCSE%206888%20Syllabus%20-%20Physical%20Science%202024-2026-1657607422.pdf",
}
papers = []
for code, subject, ns, timestamps in [
    ("6880", "Mathematics", [1,2,3,4], [1662016885,1662016949,1662016962,1662016975]),
    ("6888", "Physical Science", [1,2,4], [1662017077,1662017093,1662017167]),
]:
    for n, stamp in zip(ns,timestamps):
        papers.append(dict(id=f"{code}-2021-{n}",code=code,subject=subject,year=2021,
            session="October/November",number=n,track=("Core" if n<3 else "Extended") if code=="6880" else "All learners",
            url=BASE+f"exampapers/form5/2021/EGCSE {subject} 2021 Question Paper {n}-{stamp}.pdf".replace(" ","%20")))
for n in [1,2]:
    papers.append(dict(id=f"6888-2020-{n}",code="6888",subject="Physical Science",year=2020,
        session="October/November",number=n,track="All learners",
        url=BASE+f"exampapers/form5/2020/PHYSICAL%20SCIENCE%20{n}.pdf"))

lessons=[]
def chapter(id,title,summary,ideas,formula,watch,check,answer,resource,refs,extended=""):
    branch={"M":"maths","C":"chemistry","P":"physics"}[id[0]]
    lessons.append(dict(id=id,title=title,summary=summary,branch=branch,
        subject="maths" if branch=="maths" else "science",number=int(id[1:]),
        syllabusTopic=str(int(id[1:])) if branch=="maths" else id[0]+str(int(id[1:])),
        level="Extended" if id=="M19" else ("Core + Extended" if branch=="maths" else "All learners"),
        ideas=[dict(title=t,body=b) for t,b in ideas],formula=formula,watch=watch,
        check=dict(question=check,answer=answer),resource=resource,
        refs=[dict(paper=p,question=q,page=page,skill=skill) for p,q,page,skill in refs],
        extended=extended))

chapter("M01","Numbers, sequences & sets","Recognise number types, find patterns and organise sets.",[
("Build number sense","Integers include negative whole numbers and zero. A rational number can be written as a fraction of integers with a non-zero denominator. Prime numbers have exactly two positive factors; 1 is not prime. Prime factorisation helps you find common factors and multiples."),
("Find the rule","Compare consecutive terms. A constant difference produces an arithmetic sequence. Work forward using that difference and check the rule against every given term. In a Venn diagram, fill the overlap before the parts belonging to only one set."),
("Read set notation","The union includes everything in either set. The intersection contains elements in both. A complement means outside the set but inside the stated universal set. Count each element once.")],
r"\(a_n=a_1+(n-1)d\) (Extended general term)",
"Do not count the intersection twice when finding the union.",
"Why is 1 not prime?","It has only one positive factor, itself; a prime has two.","fractions",
[("6880-2021-2","1(a)",2,"Prime factors."),("6880-2021-2","3(a)",4,"Continue a sequence and describe the term-to-term rule.")],
"Find general terms, use set-builder notation and work with three sets.")
chapter("M02","Place value, estimation & accuracy","Round sensibly and keep track of precision.",[
("Choose the place","Decimal places count digits after the decimal point. Significant figures start at the first non-zero digit. Look at the next digit to decide whether to round the last retained digit up."),
("Estimate before calculating","Round inputs to convenient numbers to predict the size of an answer. Keep full calculator precision during a multi-step calculation and round the final result as requested."),
("Interpret a measurement","A rounded reading describes an interval of possible values. For example, 8 cm to the nearest centimetre represents values from 7.5 cm up to, but not including, 8.5 cm. Bounds calculations belong to Extended work.")],
"Round only the final result unless the question says otherwise.",
"0.00450 has three significant figures, not five.",
"Why keep extra digits during working?","Rounding early can accumulate error and change the final rounded answer.","fractions",
[("6880-2021-2","5(a)",6,"Evaluate and round to two decimal places.")],
"Calculate lower and upper bounds, including bounds for perimeter and area.")
chapter("M03","Operations with fractions & decimals","Make calculations reliable, with or without a calculator.",[
("Use the correct order","Work inside brackets first, then powers, then multiplication and division from left to right, then addition and subtraction from left to right. A negative sign must stay with its number."),
("Work with fractions","To add or subtract, first express the fractions over a common denominator. To multiply, multiply numerators and denominators. To divide, multiply by the reciprocal of the second fraction."),
("Check the result","Simplify by dividing the numerator and denominator by the same non-zero common factor. A mixed number can be converted to an improper fraction before calculation.")],
r"\(\frac ab+\frac cd=\frac{ad+bc}{bd}\)",
"Adding the denominators gives the wrong answer.",
"Why is 1/2 + 1/3 not 2/5?","The fractions refer to different-sized parts. Use sixths: 3/6 + 2/6 = 5/6.","fractions",
[("6880-2021-3","3",2,"Fraction arithmetic; show the intermediate steps.")])
chapter("M04","Percentages","Compare changes using the correct original amount.",[
("Translate a percentage","A percentage is a fraction out of 100. Multiply an amount by the percentage divided by 100 to find that part. To compare two amounts, divide the part by the whole and multiply by 100."),
("Calculate change","Find the difference first, then divide by the original amount. An increase of 15% multiplies an amount by 1.15; a decrease of 15% multiplies it by 0.85."),
("Explain your base","The denominator matters: a rise from 40 to 50 is 25%, but a fall from 50 to 40 is 20%. The same difference can represent different percentage changes.")],
r"\(\text{percentage change}=\frac{\text{new}-\text{original}}{\text{original}}\times100\%\)",
"Use the original amount as the denominator.",
"Does a 10% rise followed by a 10% fall restore the starting value?","No. The multipliers give 1.10 × 0.90 = 0.99, a net 1% decrease.","percent",
[("6880-2021-2","3(b)",4,"Percentage increase.")],
"For reverse percentages, divide by the multiplier; repeated changes use repeated multiplication.")
chapter("M05","Money & household finance","Apply percentages to savings, budgets and prices.",[
("Match rate and time","Simple interest adds the same amount each year. Express a yearly percentage rate as a decimal and convert months to years. Compound interest instead applies the rate to the updated balance."),
("Read the context","A budget compares total income with total costs. Profit is selling price minus cost price. Currency conversion follows the direction of the stated exchange rate; write the units beside it."),
("Keep money readable","Use full precision while calculating, then show money to two decimal places. An examination's tax or exchange rate is supplied information, not a statement about current rates.")],
r"\(I=Prt,\qquad A=P(1+r)^n\)",
"Interest is not the same as the final balance.",
"What does a balance of E1200 after depositing E1000 imply about total interest?","The interest is E200, provided there were no other deposits, withdrawals or fees.","percent",
[("6880-2021-1","5",4,"Simple interest with time given in months.")])
chapter("M06","Ratio & proportion","Scale quantities together and divide totals fairly.",[
("Understand parts","A ratio compares quantities in the same units. To share a total in the ratio 2:3, there are five equal parts. Find one part, then multiply by each required number of parts."),
("Use proportionality","In direct proportion, multiplying one quantity by a factor multiplies the other by the same factor. A scale drawing uses a fixed ratio between drawing length and actual length."),
("Check the total","Add all shares to recover the original total. When scaling, convert units before comparing lengths; 2 cm and 2 m are not equal quantities.")],
r"\(\text{one part}=\frac{\text{total}}{\text{sum of ratio parts}}\)",
"A ratio of 2:3 does not mean the first share is 2/3 of the total.",
"If a recipe is doubled, what happens to every ingredient in a fixed ratio?","Each ingredient doubles; the ratio stays the same.","fractions",
[("6880-2021-1","11",7,"Use a ratio to find an unknown height.")],
"Express direct, inverse and joint variation algebraically; determine the constant using the given values.")
chapter("M07","Indices","Simplify powers and recognise roots and reciprocals.",[
("Keep the base","Multiplying powers of the same base adds their indices. Dividing them subtracts the indices. Raising a power to another power multiplies the indices."),
("Interpret special indices","A non-zero base to the power zero is 1. A negative index means a reciprocal. A fractional index describes a root: the denominator gives the root and the numerator the power."),
("Check the operation","These rules apply to multiplication and division, not to addition. Substitute a small numerical value if you are unsure whether two expressions are equal.")],
r"\(a^m a^n=a^{m+n},\quad a^{-n}=\frac1{a^n},\quad a^{1/2}=\sqrt a\)",
"Do not replace a^m + a^n with a^(m+n).",
"Why is 2⁻³ equal to 1/8?","The negative exponent means reciprocal: 1/(2³) = 1/8.","algebra-video",
[("6880-2021-2","1(b), 1(d)",2,"Index laws and index form.")],
"Solve index equations by expressing both sides with a common base.")
chapter("M08","Standard form","Read very small and very large numbers efficiently.",[
("Normalise the coefficient","Standard form writes a positive number as a × 10ⁿ with 1 ≤ a < 10. Count decimal-place movements carefully and check whether the original number is large or small."),
("Calculate in stages","Multiply or divide the coefficients and use index laws for powers of ten. Then adjust the coefficient back into the required interval."),
("Check magnitude","A negative exponent makes a positive coefficient smaller. Scientific calculator displays such as 2.4E−3 mean 2.4 × 10⁻³, not 2.4 multiplied by a letter E.")],
r"\(a\times10^n,\quad 1\leq a<10\)",
"The coefficient cannot be 24 in a final standard-form answer.",
"Write 0.006 as a power-of-ten expression.","6 × 10⁻³.","fractions",
[("6880-2021-1","4(a)",3,"Convert a small decimal to standard form.")],
"Use standard form in multi-step calculations and renormalise the result.")
chapter("M09","Shapes, angles & similarity","Use properties and reasons to find unknown angles.",[
("Start with known angle facts","Angles on a straight line sum to 180°, around a point to 360°, and in a triangle to 180°. Parallel lines create equal corresponding and alternate angles."),
("Use shape properties","An isosceles triangle has two equal base angles. For an n-sided polygon, split it into n−2 triangles to obtain the interior-angle sum. A regular polygon has equal sides and equal angles."),
("Think about scale","Similar shapes have equal corresponding angles and proportional corresponding lengths. Symmetry can involve a mirror line or a rotation smaller than a full turn.")],
r"\(\text{interior-angle sum}=(n-2)\times180^\circ\)",
"A diagram marked 'not to scale' must be solved from its information, not measured.",
"Why are the base angles of an isosceles triangle equal?","They lie opposite equal sides; the two halves mirror one another.","construction",
[("6880-2021-1","16",12,"Interior angle of a regular polygon.")],
"Apply circle theorems, congruence arguments and area/volume scale factors.")
chapter("M10","Geometrical constructions","Construct accurately and show the arcs that justify your answer.",[
("Construct a triangle","Draw one known side with a ruler. From each end, draw an arc with radius equal to the appropriate remaining side. Their intersection locates the third vertex."),
("Bisect a segment","Use equal-radius arcs from the segment's endpoints, with radius more than half the segment length. Join the arc intersections to obtain the perpendicular bisector."),
("Show evidence","Keep construction arcs visible. Use a sharp pencil and measure only when instructed. A triangle can exist only if any two side lengths sum to more than the third.")],
"Construction arcs are part of the working.",
"Drawing a shape that looks right does not establish the requested lengths.",
"Why must the radius used for a perpendicular bisector exceed half the segment?","The two arcs must intersect above and below the segment.","construction",
[("6880-2021-1","7",5,"Ruler-and-compasses triangle construction.")])
chapter("M11","Transformations","Describe the rule that maps an object to its image.",[
("Name the transformation","A translation moves every point by the same vector. A reflection flips across a mirror line. A rotation needs a centre, angle and direction. An enlargement needs a centre and scale factor."),
("Track a point","Apply the rule to each vertex. For a translation (a,b), add a to x and b to y. For reflection in the y-axis, change x to −x and keep y."),
("Describe completely","Use corresponding vertices to check distances, orientation and size. A negative enlargement scale factor places the image on the opposite side of the centre.")],
r"\((x,y)\mapsto(x+a,y+b)\)",
"Naming 'rotation' without its centre and angle is incomplete.",
"Does a translation change lengths or angles?","No. Every point moves the same distance in the same direction.","coordinates",
[("6880-2021-2","13(a–c)",15,"Translate, reflect and enlarge shapes.")],
"Reflect in sloping lines, combine transformations and represent them with matrices.")
chapter("M12","Measurement & mensuration","Choose compatible units and the correct area or volume model.",[
("Convert before substituting","Length, area and volume scale differently: 1 m = 100 cm, 1 m² = 10 000 cm² and 1 m³ = 1 000 000 cm³. Convert all dimensions to the same length unit."),
("Choose a model","A prism has a constant cross-section. Its volume is cross-sectional area times length. Surface area is the sum of the outside faces; do not confuse it with volume."),
("Break up complex shapes","Split a composite area into familiar shapes or subtract a missing part. A sector occupies angle/360 of its full circle. Convert time carefully: decimal hours are fractions of an hour.")],
r"\(V_{\text{prism}}=A_{\text{cross-section}}l,\quad A_{\text{circle}}=\pi r^2\)",
"Use square units for area and cubic units for volume.",
"How many cubic centimetres are in one litre?","1000 cm³.","pythagoras",
[("6880-2021-1","13",9,"Find a cuboid's missing dimension.")],
"Solve problems involving hollow solids, frustums and rates of change.")
chapter("M13","Trigonometry","Select a triangle relation from the information given.",[
("Label first","The hypotenuse is opposite the right angle. The opposite and adjacent sides depend on the angle you are using. Label the triangle before selecting sine, cosine or tangent."),
("Choose the relationship","Use Pythagoras when two sides of a right triangle are known. Use a trigonometric ratio when an acute angle and a side are involved. Use inverse sine, cosine or tangent to recover an angle."),
("Interpret your answer","Use degree mode for these exercises. The hypotenuse must be the longest side, and a right triangle's two other angles sum to 90°.")],
r"\(a^2+b^2=c^2,\quad \sin\theta=\frac OH,\quad\cos\theta=\frac AH,\quad\tan\theta=\frac OA\)",
"Pythagoras and SOHCAHTOA require a right-angled triangle.",
"Which side stays the hypotenuse when you choose a different acute angle?","The side opposite the right angle stays the hypotenuse.","trig",
[("6880-2021-2","2(a)",3,"Find a right-triangle angle.")],
"Study sine and cosine rules, ½ab sin C, graphs, equations and three-dimensional problems.")
chapter("M14","Bearings","Measure direction clockwise from north.",[
("Use the starting point","The bearing of B from A is measured at A. Draw a north line there, then turn clockwise towards B."),
("Write three digits","North is 000°, east is 090°, south is 180° and west is 270°. A reverse bearing differs by 180°, adjusted into the interval from 000° to 359°."),
("Connect to triangles","For a scale drawing, choose a sensible distance scale. Parallel north lines help you identify angles before using geometry or trigonometry.")],
r"\(\text{reverse bearing}=(\text{bearing}+180^\circ)\bmod360^\circ\)",
"Do not measure a bearing anticlockwise or start at the destination.",
"What is the reverse bearing of 070°?","250°.","trig",
[("6880-2021-1","17(b)",12,"Find a reverse bearing.")])
chapter("M15","Graphs in practical situations","Turn a story about change into a useful graph.",[
("Read both axes","Check the quantities, units and scale. On a distance-time graph, gradient is speed. A horizontal section represents no change in distance."),
("Work by sections","Calculate change in distance divided by change in time for each straight section. A steeper line means a greater speed when the axes use the same scales."),
("Add context","Mark stops, start times and arrival times. A conversion graph needs matching pairs of equivalent values. Use units to distinguish a gradient from an area.")],
r"\(\text{speed}=\frac{\Delta\text{distance}}{\Delta\text{time}}\)",
"A horizontal distance-time line means stopped; a horizontal speed-time line means constant speed.",
"A traveller covers 90 km in 1.5 h. What is the average speed?","60 km/h.","coordinates",
[("6880-2021-3","17",10,"Draw and interpret a distance-time journey graph.")],
"For speed-time graphs, gradient gives acceleration and area gives distance; use tangents for changing gradients.")
chapter("M16","Vectors","Describe movement with both size and direction.",[
("Read components","A two-dimensional vector states horizontal movement then vertical movement. Positive components mean right and up; negative components mean left and down."),
("Combine movements","Add or subtract matching components. Multiplication by a scalar changes length; a negative scalar also reverses direction."),
("Find a length","A vector's magnitude follows Pythagoras from its perpendicular components. It is a non-negative scalar, whereas the vector still has direction.")],
r"\(\left|\binom ab\right|=\sqrt{a^2+b^2}\)",
"Subtracting vectors is order-sensitive: AB and BA point in opposite directions.",
"What does multiplying a vector by −2 do?","It doubles the magnitude and reverses the direction.","pythagoras",
[("6880-2021-2","13(a)",15,"Apply a translation vector.")],
"Use position vectors, coplanar vector expressions, scalar multiples and collinearity arguments.")
chapter("M17","Algebra & formulae","Represent a situation, simplify it and rearrange it.",[
("Combine like terms","Terms such as 3x and 5x can be combined because they contain the same variable part. Expanding means multiplying every term inside a bracket."),
("Reverse the operation","Factorising writes a sum as a product. Look first for a common factor. For x²+bx+c, seek two numbers whose sum is b and product is c."),
("Change the subject","Undo operations in reverse order, performing the same operation on both sides. When substituting a negative number, use brackets before squaring it.")],
r"\(a(b+c)=ab+ac,\quad x^2-y^2=(x-y)(x+y)\)",
"x² + x cannot be simplified to 2x².",
"Expand 3(x + 4).","3x + 12: multiply both terms by 3.","algebra-video",
[("6880-2021-1","8",6,"Factorise and simplify expressions.")],
"Rearrange with the subject on both sides, factorise harder quadratics and simplify algebraic fractions.")
chapter("M18","Coordinates, graphs & functions","Connect an equation to points, gradients and a graph.",[
("Plot consistently","Coordinates give horizontal position first, then vertical position. Substitute x-values into an equation to make a table of matching y-values."),
("Read a straight line","In y=mx+c, m is the gradient and c is the y-intercept. Calculate gradient using vertical change divided by horizontal change."),
("Use function notation","f(x) means the output of a rule at input x, not multiplication by f. An inverse reverses the rule when it is well-defined. Check a rearranged formula by substituting a known input.")],
r"\(m=\frac{y_2-y_1}{x_2-x_1},\quad y=mx+c\)",
"A vertical line has an undefined gradient; do not divide by zero.",
"What is the y-intercept of y = 3x − 5?","−5, since x = 0 at the y-axis.","coordinates",
[("6880-2021-2","10(c)",11,"Gradient, intercept and equation of a line.")],
"Use perpendicular gradients, composite functions, nonlinear graphs and graphical solutions.")
chapter("M19","Differentiation","Find the gradient of a curve at a point.",[
("A changing gradient","A curve can have a different gradient at every point. Its derivative gives a rule for calculating the gradient of the tangent."),
("Use the power rule","For a term axⁿ, multiply the coefficient by n and reduce the power by one. Differentiate each term separately. A constant has derivative zero."),
("Locate stationary points","Set the derivative equal to zero, solve for x, then substitute into the original function to find y. A gradient changing from negative to positive indicates a minimum; positive to negative indicates a maximum.")],
r"\(\frac{d}{dx}(ax^n)=anx^{n-1}\)",
"Substitute into the derivative for a gradient, and into the original function for a y-coordinate.",
"What is the gradient of y = 3x² at x = 2?","The derivative is 6x, so the gradient is 12.","derivative",
[("6880-2021-4","14(b)",18,"Use a tangent gradient to locate a point on a curve.")],
"This entire chapter is Extended. The syllabus covers positive integer powers and constants in simple polynomial sums.")
chapter("M20","Equations & inequalities","Solve, check and communicate the allowed values.",[
("Keep equality balanced","Collect like terms and undo operations on both sides. Substituting the solution back into the original equation is a quick independent check."),
("Choose a method","For simultaneous linear equations, eliminate a variable or substitute one expression into the other. For a factorised quadratic equal to zero, at least one factor must be zero."),
("Handle inequalities","Treat an inequality similarly to an equation, except that multiplying or dividing both sides by a negative number reverses its direction. An open endpoint excludes the boundary; a filled endpoint includes it.")],
r"\(ax+b=c\implies x=\frac{c-b}{a},\quad a\ne0\)",
"Dividing an inequality by a negative number reverses its sign.",
"If −2x < 6, what values satisfy the inequality?","x > −3.","algebra-video",
[("6880-2021-3","6",3,"Solve a linear equation.")],
"Solve quadratic, simultaneous nonlinear and fractional equations; use the quadratic formula and completing the square.")
chapter("M21","Matrices","Organise numbers in rows and columns.",[
("Check the order","A matrix with m rows and n columns has order m×n. Addition and subtraction require matching orders and act on corresponding entries."),
("Multiply carefully","A scalar multiplies every entry. For a matrix product, each result is a row-by-column dot product. The number of columns in the first matrix must equal the number of rows in the second."),
("Use identity","The identity matrix leaves a compatible vector or matrix unchanged when multiplied. Matrix multiplication generally depends on order, so AB need not equal BA.")],
r"\(\begin{pmatrix}a&b\\c&d\end{pmatrix}\binom xy=\binom{ax+by}{cx+dy}\)",
"Do not multiply only corresponding entries to calculate a matrix product.",
"Can a 2×3 matrix multiply a 3×1 matrix?","Yes. The inner dimensions match and the result has order 2×1.","matrices",
[("6880-2021-4","3(b–d)",3,"Scalar and row-by-column multiplication.")],
"Use determinants and inverses of non-singular 2×2 matrices, and apply them to equations and transformations.")
chapter("M22","Inequality regions & linear programming","Translate restrictions into a feasible region.",[
("Draw the boundary","Replace an inequality by an equality to draw its boundary. Use a solid line for ≤ or ≥ and a broken line for < or >."),
("Test a point","Choose a point away from the boundary, often (0,0). Substitute it into the inequality to decide which side is allowed. State clearly whether your shading shows wanted or unwanted regions."),
("Interpret restrictions","A non-negative number of objects means x≥0. 'At most' includes the boundary; 'more than' does not. In Extended optimisation, check feasible corner points and any integer restrictions.")],
r"\(\text{at most }k\Rightarrow x+y\leq k\)",
"A strict inequality does not include its boundary.",
"What does 'at least 12 items' mean as an inequality?","If n is the number of items, n ≥ 12.","coordinates",
[("6880-2021-1","14",10,"Read inequalities from a shaded region.")],
"Combine constraints, evaluate an objective at feasible vertices and solve simple optimisation problems.")
chapter("M23","Statistics","Summarise data and choose a clear representation.",[
("Choose a measure","The mean uses every value, the median is the middle of ordered data, and the mode is the most frequent value. The range is maximum minus minimum."),
("Read frequencies","A frequency tells you how often a value occurs. To calculate the mean from a frequency table, multiply each value by its frequency and divide the sum by total frequency."),
("Question a graph","Look at scales, units and sample size. Correlation describes association; it alone does not show that one variable causes another. A line of best fit summarises a trend without joining every point.")],
r"\(\bar x=\frac{\sum fx}{\sum f}\)",
"The median requires ordered data; it is not always the mean.",
"Which average is most affected by a single very large outlier?","Usually the mean, because every value contributes to its sum.","statistics",
[("6880-2021-2","11(a)",12,"Mean, median and mode from a frequency table.")],
"Estimate grouped means, use cumulative frequency and box plots, and calculate frequency density for unequal class widths.")
chapter("M24","Probability","Count possible outcomes and explain the assumptions.",[
("Build a sample space","For equally likely outcomes, divide the number favourable to the event by the total number. Probabilities range from 0 to 1."),
("Use complements","If an event happens with probability p, its complement has probability 1−p. This can avoid listing many separate outcomes."),
("Combine events","In a tree, multiply along a path and add mutually exclusive paths. With replacement the composition stays the same; without replacement update both the available count and total before the next draw.")],
r"\(P(A)=\frac{\text{favourable outcomes}}{\text{total equally likely outcomes}}\)",
"Do not assume two events are independent without checking the situation.",
"Why do denominators change in draws without replacement?","The first object is not returned, so fewer objects are available on the next draw.","probability",
[("6880-2021-2","11(b)",13,"Find probabilities from frequency data.")],
"Use combined-event rules and more complex trees, possibility spaces and Venn diagrams.")

chapter("C01","Measuring in chemistry","Select apparatus and record a useful reading.",[
("Choose the instrument","A measuring cylinder measures a range of approximate volumes. A volumetric pipette delivers a fixed volume accurately. A burette delivers a measured variable volume, often during a titration."),
("Take the reading","Read the bottom of a water-like liquid's meniscus at eye level. A burette scale usually increases downwards. The volume delivered is the final reading minus the initial reading."),
("Record evidence","Put units in table headings, retain the precision supported by the instrument and repeat readings where possible. Practical work is done with a teacher in an equipped laboratory.")],
r"\(\text{delivered volume}=\text{final reading}-\text{initial reading}\)",
"A burette reading is not itself the volume delivered unless it started at zero.",
"Why should the eye be level with the meniscus?","To avoid parallax error from viewing at an angle.","measurement",
[("6888-2021-4","1(c)(iv)",4,"Interpret a measured liquid volume in an experiment.")])
chapter("C02","Particles & states of matter","Explain changes using particle arrangement and movement.",[
("Compare states","Solid particles vibrate about fixed positions. Liquid particles remain close but move past one another. Gas particles move freely with large separations."),
("Explain heating","Heating usually increases particles' average kinetic energy. During melting or boiling of a pure substance at fixed pressure, energy changes particle separation without increasing temperature."),
("Explain diffusion","Random motion spreads particles from a more concentrated region into a less concentrated region overall. Higher temperature generally speeds diffusion because particles move faster.")],
"State changes rearrange particles; they do not change their chemical identity.",
"Particles do not expand when a substance expands; their average separation changes.",
"Why can a gas be compressed much more easily than a liquid?","Most of a gas's volume is space between particles.","particles",
[("6888-2020-1","3",3,"State changes and the structure of a solid.")])
chapter("C03","Elements, compounds & mixtures","Distinguish bonding from simple mixing.",[
("Classify a sample","An element contains one kind of atom. A compound contains different elements chemically joined in fixed proportions. A mixture contains substances together without a fixed chemical composition."),
("Read particle diagrams","Identical pairs of the same atom can still be an element. Identical particles containing different atoms indicate a compound. Two or more different particle types together indicate a mixture."),
("Choose separation","Mixture components retain their properties and can often be separated physically. Breaking a compound into simpler substances requires a chemical change.")],
"One particle type can contain more than one element.",
"A molecule such as O₂ is an element, not a compound.",
"Is air a compound or a mixture? Explain.","A mixture: its gases are not bonded into a fixed chemical formula.","matter",
[("6888-2020-1","1",2,"Recognise the composition of water molecules.")])
chapter("C04","Separation & purity","Select a method from the properties that differ.",[
("Separate solids and liquids","Filtration removes an insoluble solid from a liquid. Evaporation or crystallisation can recover a dissolved solid. Simple distillation collects a solvent after vaporisation and condensation."),
("Separate closer mixtures","Fractional distillation separates liquids by boiling behaviour using repeated vaporisation and condensation. A separating funnel suits immiscible liquids. Chromatography separates soluble substances by different movement through a medium."),
("Check purity","A pure substance has a characteristic sharp melting point under stated conditions. Impurities commonly lower and broaden the melting range. More than one chromatography spot can indicate a mixture.")],
"Select the method from differences in physical properties.",
"A dissolved salt passes through filter paper with the water.",
"How could you collect pure water from a salt solution?","Use simple distillation: vaporise the water and condense it into a clean receiver.","matter",
[("6888-2020-1","5",4,"Explain fractional distillation.")])
chapter("C05","Physical & chemical changes","Use evidence to decide whether new substances form.",[
("Identify the change","Melting, boiling and dissolving are often physical changes because the substances retain their chemical identity. A chemical reaction changes the substances present by rearranging atoms."),
("Use evidence carefully","A colour change, precipitate, gas or temperature change may support a chemical reaction. Consider the context: boiling also makes bubbles without producing a new substance."),
("Conserve atoms","In a closed system, total mass is conserved because atoms are rearranged, not created or destroyed. A measured mass may fall in an open container if a gas escapes.")],
"Chemical change forms new substances.",
"Reversibility alone is not a reliable test of whether a change is chemical.",
"Why is melting ice a physical change?","Both the ice and liquid are H₂O; only the arrangement and movement change.","matter",
[("6888-2021-4","1(b)(ii–iii)",3,"Use observations to identify a chemical change.")])
chapter("C06","The periodic table","Use electronic structure to predict patterns.",[
("Locate an element","Elements are ordered by proton number. A period corresponds to the number of occupied electron shells for the first 20 elements. In the main groups, outer-shell electrons help explain chemical similarities."),
("Compare families","Group I metals tend to form +1 ions; Group VII halogens tend to form −1 ions. Noble gases have a filled outer shell and are relatively unreactive."),
("Explain properties","Moving down a group changes atomic size and electron shielding. Transition elements often have high melting points, form coloured compounds and act as catalysts; avoid treating every trend as exceptionless.")],
"For a neutral atom: electrons = protons.",
"Group number is not the total number of electrons.",
"Why do elements in a main group often react similarly?","Their atoms have the same number of outer-shell electrons.","atom",
[("6888-2020-1","13",8,"Noble gas use and transition-element properties.")])
chapter("C07","Atoms, ions & bonding","Connect subatomic particles to bonding and properties.",[
("Count particles","Protons are positive, neutrons neutral and electrons negative. Proton number identifies the element. Nucleon number is protons plus neutrons. Isotopes have the same proton number but different neutron numbers."),
("Build ions and bonds","Losing electrons produces a positive ion; gaining electrons produces a negative ion. Ionic bonding is attraction between oppositely charged ions. A covalent bond shares a pair of electrons."),
("Explain a property","Ionic solids do not conduct because their ions cannot move; molten or aqueous ionic substances can. Metals conduct using mobile delocalised electrons. Giant covalent structures require many strong bonds to be broken.")],
r"\(N=A-Z,\quad \text{ion charge}=\text{protons}-\text{electrons}\)",
"Forming an ion changes electrons, not the number of protons.",
"What happens to a magnesium atom when it forms Mg²⁺?","It loses two electrons; its nucleus is unchanged.","atom",
[("6888-2021-2","1",2,"Atoms, ions, isotopes and electron arrangements.")])
chapter("C08","Formulae, equations & moles","Use balanced equations to calculate reacting quantities.",[
("Balance without changing formulae","Count atoms on each side and adjust coefficients. Changing a subscript changes the substance. For ionic formulae, choose ion counts that make the total charge zero."),
("Convert mass to amount","Find relative formula mass by adding the supplied relative atomic masses. Divide mass in grams by molar mass in g/mol to find moles. The equation coefficients give mole ratios, not mass ratios."),
("Check the limiting reactant","Divide each available reactant's moles by its coefficient. The smaller value limits the reaction. At room temperature and pressure use 24 dm³ per mole of gas when specified; convert cm³ to dm³ for concentration.")],
r"\(n=\frac mM,\quad c=\frac nV,\quad V_{\mathrm{gas}}=24n\ {\rm dm^3}\ \text{at r.t.p.}\)",
"A volume in cm³ must be divided by 1000 before using mol/dm³.",
"What is the relative formula mass of CO₂ using C=12 and O=16?","12 + 2×16 = 44.","moles",
[("6888-2021-2","7(c)(ii–iii), 7(d)",10,"Moles, limiting reagent and percentage composition.")])
chapter("C09","Reactions, energy & rates","Explain why reactions transfer energy and change speed.",[
("Track energy","Breaking bonds requires energy; forming bonds releases it. If more is released than absorbed, the reaction is exothermic. An endothermic reaction absorbs energy overall."),
("Use collision theory","A successful reaction needs particles to collide with enough energy. Higher temperature, higher solution concentration or a larger exposed surface can increase successful collisions per second. A catalyst supplies an alternative lower-activation-energy route."),
("Read the evidence","On a product-volume graph, a steeper gradient means a faster rate. A plateau means no more measured product is being made. Oxidation is electron loss and reduction is electron gain.")],
r"\(Q=mc\Delta T,\quad \text{average rate}=\frac{\text{change in quantity}}{\text{time}}\)",
"A catalyst changes rate, not the amount of product available from fixed limiting reactant.",
"Is bond breaking exothermic or endothermic?","Endothermic: energy must be supplied to break a bond.","reactions",
[("6888-2021-1","6",5,"Calculate energy transferred to water.")])
chapter("C10","Acids, bases & salts","Connect reactions, indicators and identification tests.",[
("Classify solutions","Acidic aqueous solutions have pH below 7 and alkaline ones above 7, near room temperature. Neutral solutions have pH about 7. An alkali is a soluble base."),
("Predict products","Acid + base produces salt + water. Acid + carbonate produces salt + water + carbon dioxide. Some metals react with dilute acids to release hydrogen. The acid supplies the anion in the salt."),
("Identify carefully","Carbon dioxide turns limewater milky; hydrogen gives a squeaky pop with a lighted splint; oxygen relights a glowing splint. Ion tests use prescribed reagents and observations. Learn these as supervised laboratory methods.")],
r"\(\mathrm{H^+(aq)+OH^-(aq)\rightarrow H_2O(l)}\)",
"Strength and concentration describe different things; do not use them interchangeably.",
"Which gas is produced when a carbonate reacts with dilute acid?","Carbon dioxide, alongside a salt and water.","acids",
[("6888-2021-4","1(a)",2,"Indicators, pH and conclusions.")])
chapter("C11","Metals & reactivity","Predict displacement and choose extraction methods.",[
("Compare reactivity","A more reactive metal can displace a less reactive metal from its salt solution. Use observations of reaction or no reaction to order unfamiliar metals."),
("Extract a metal","Metals below carbon in the reactivity series can often be extracted by reduction with carbon or carbon monoxide. Highly reactive metals such as aluminium require electrolysis of molten compounds."),
("Prevent corrosion","Rusting of iron requires water and oxygen. Paint provides a barrier; a more reactive attached metal can act sacrificially. Alloys alter properties by mixing elements and disturbing regular metal layers.")],
"Displacement: more reactive metal → less reactive metal's salt.",
"A metal cannot displace one above it in the reactivity series.",
"Why can zinc protect scratched iron?","Zinc oxidises preferentially and provides sacrificial protection.","reactions",
[("6888-2021-2","7(a–c)(i)",9,"Properties, displacement and electron transfer.")])
chapter("C12","Electrolysis","Follow mobile ions and electron transfer at each electrode.",[
("Make a conducting electrolyte","Ionic compounds need mobile ions, so they must be molten or dissolved. A solid ionic lattice has fixed ions and does not conduct."),
("Track each ion","Positive ions move to the negative cathode and gain electrons: reduction. Negative ions move to the positive anode and lose electrons: oxidation."),
("Predict products","A molten binary ionic compound provides just its own two ion types. An aqueous solution also contains ions from water, so products depend on concentration, reactivity and electrode material.")],
"Cathode: reduction. Anode: oxidation.",
"Cathode and anode refer to reactions; use the correct signs for an electrolytic cell.",
"What happens to Cu²⁺ at a cathode where copper is deposited?","Cu²⁺ + 2e⁻ → Cu: the ions gain electrons.","electrolysis",
[("6888-2021-2","5",7,"Electrolysis of acidified water.")])
chapter("C13","Non-metals, air & water","Link common substances to preparation, uses and environmental effects.",[
("Use familiar gases","Air is mainly nitrogen and oxygen. Oxygen supports combustion; hydrogen can be used as a fuel. Carbon dioxide is produced in combustion of carbon-containing fuels and removed in photosynthesis."),
("Treat and test water","Filtration removes suspended particles and appropriate disinfection reduces harmful microorganisms. Dissolved salts can remain after filtration. Temporary hardness can produce scale when water is boiled."),
("Connect industry and environment","Nitrogen and hydrogen combine to make ammonia in the Haber process. Fertilisers provide nutrients, but excessive runoff can damage waterways. Distinguish carbon monoxide, a toxic gas, from carbon dioxide, a greenhouse gas.")],
r"\(\mathrm{N_2+3H_2\rightleftharpoons2NH_3}\)",
"Filtration alone does not make every water sample safe to drink.",
"Why does a fertiliser's nitrogen content matter?","Plants use nitrogen to make amino acids and proteins needed for growth.","matter",
[("6888-2021-2","3",4,"Ammonia, fertilisers and nitrogen separation.")])
chapter("C14","Organic chemistry","Recognise families and use structure to predict reactions.",[
("Spot the family","Hydrocarbons contain only carbon and hydrogen. Alkanes are saturated with carbon-carbon single bonds. Alkenes contain a carbon-carbon double bond and can undergo addition reactions."),
("Connect structure and reaction","Alcohols contain an –OH group and carboxylic acids contain –COOH. Complete hydrocarbon combustion produces carbon dioxide and water; incomplete combustion can form carbon monoxide or carbon."),
("Build larger molecules","Addition polymerisation joins unsaturated monomers without losing small molecules. Condensation polymerisation forms links while eliminating small molecules such as water. Think about disposal and persistence of polymers.")],
r"\(\text{alkanes: }C_nH_{2n+2};\quad\text{single-double-bond acyclic alkenes: }C_nH_{2n}\)",
"Cracking and fractional distillation are different: cracking breaks molecules; distillation separates them.",
"Which hydrocarbon family decolourises bromine water readily?","Alkenes, by addition across the carbon-carbon double bond.","organic",
[("6888-2021-2","9",12,"Addition and condensation polymers.")])

chapter("P01","Measurements, units & density","Measure physical quantities and connect mass to volume.",[
("Use appropriate instruments","Measure length with a suitable rule, caliper or micrometer, and mass with a balance. Read scales at eye level and check for a zero error."),
("Determine volume","Use geometry for regular solids. For an insoluble irregular solid fully submerged without trapped air, displaced liquid volume equals object volume."),
("Calculate density","Divide mass by volume using compatible units. An object of lower average density than a liquid can float. Repeat measurements to reduce the effect of random variation.")],
r"\(\rho=\frac mV\)",
"Mass and weight are different quantities; density uses mass.",
"A 60 g object has volume 20 cm³. What is its density?","3 g/cm³.","measurement",
[("6888-2021-2","2",3,"Volume, displacement and density.")])
chapter("P02","Motion","Interpret speed, velocity, acceleration and graphs.",[
("Distinguish quantities","Speed describes how quickly distance is covered. Velocity includes direction. Average speed is total distance divided by total elapsed time, including stops."),
("Calculate acceleration","Acceleration is change in velocity per unit time. On a straight-line speed-time graph segment, its gradient gives the rate of change of speed and the area below gives distance travelled."),
("Explain falling","Near Earth, use g=10 m/s² for these syllabus exercises unless told otherwise. Falling objects with air resistance eventually reach terminal velocity when upward resistance balances weight.")],
r"\(v=\frac dt,\quad a=\frac{v-u}{t}\)",
"Zero acceleration does not mean zero speed.",
"What does a horizontal speed-time line above zero show?","A constant non-zero speed.","motion",
[("6888-2021-2","4",5,"Falling motion, air resistance and terminal velocity.")])
chapter("P03","Mass, force & moments","Use resultant force and turning effects to explain motion.",[
("Separate mass and weight","Mass measures inertia and is in kilograms. Weight is gravitational force in newtons and equals mg. Use the resultant force, not just one force, in F=ma."),
("Consider stretching","A load-extension graph may begin with a straight proportional region. Beyond the limit of proportionality, equal load increases no longer produce equal extension increases."),
("Balance turning effects","A moment is force times perpendicular distance from the pivot. In rotational equilibrium, clockwise and anticlockwise moments balance. A low centre of mass and a broad base generally improve stability.")],
r"\(W=mg,\quad F=ma,\quad \text{moment}=F d_\perp\)",
"Use perpendicular distance from the pivot, not any sloping distance.",
"What resultant force acts when velocity stays constant?","Zero resultant force.","forces",
[("6888-2021-2","6",8,"Weight and balanced moments in a crane.")])
chapter("P04","Work, energy & power","Track transfers and calculate the rate of doing work.",[
("Describe the transfer","Work is done when a force moves an object along the force's direction. Energy is conserved, but useful energy can be transferred to less useful thermal stores."),
("Calculate stores","Kinetic energy depends on mass and the square of speed. Gravitational potential energy changes with mass, gravitational field strength and vertical height."),
("Compare power","Power is energy transferred per second. Two devices can transfer the same energy but at different powers if they take different times. Efficiency compares useful output to total input.")],
r"\(E_k=\tfrac12mv^2,\quad E_p=mgh,\quad W=Fd,\quad P=\frac Et\)",
"Doubling speed quadruples kinetic energy; it does not merely double it.",
"How much power transfers 300 J in 5 s?","60 W.","energy",
[("6888-2020-2","1(b–c)",2,"Gravitational energy and energy transfer.")])
chapter("P05","Waves, light & sound","Connect wave measurements and explain reflection and refraction.",[
("Name the quantities","Wavelength is the distance between neighbouring points in phase. Frequency is cycles per second. Amplitude is maximum displacement from equilibrium. Wave speed equals frequency times wavelength."),
("Compare types","Transverse oscillations are perpendicular to travel; longitudinal oscillations are parallel. Sound needs a medium, while electromagnetic waves can cross a vacuum. Higher sound frequency means higher pitch."),
("Follow a ray","Measure incidence and reflection angles from the normal. Refraction changes direction when wave speed changes at a boundary. Use carefully drawn rays to locate lens images; include the focal points.")],
r"\(v=f\lambda,\quad n=\frac{\sin i}{\sin r}\)",
"Measure ray angles from the normal, not the surface.",
"Does greater amplitude change the pitch of a sound?","No. Amplitude affects loudness; frequency determines pitch.","waves",
[("6888-2021-1","3",3,"Electromagnetic spectrum."),("6888-2021-1","17",10,"Longitudinal waves and sound.")])
chapter("P06","Thermal physics","Explain expansion, thermometers and heat transfer.",[
("Measure temperature","A thermometer uses a property that changes with temperature. Calibrate at known reference points. Range is the span it can measure; sensitivity is the output change per degree."),
("Distinguish transfers","Conduction transfers energy through interactions in matter, aided by mobile electrons in metals. Convection involves bulk movement in a fluid. Infrared radiation can transfer energy through a vacuum."),
("Explain a design","Insulation slows transfer. Shiny surfaces are poor infrared absorbers and emitters. During a change of state of a pure substance at constant pressure, energy can be transferred while temperature stays constant.")],
"Conduction · convection · infrared radiation",
"Heat transfer and temperature are not the same physical quantity.",
"Why does a vacuum reduce conduction and convection?","There are no particles in a perfect vacuum to carry out those processes.","thermal",
[("6888-2021-2","10",14,"Thermometer sensitivity, range and thermocouples.")])
chapter("P07","Electrostatics","Explain charging through electron transfer.",[
("Move electrons","Rubbing can transfer electrons between materials. Losing electrons leaves an object positively charged; gaining electrons makes it negative. The total charge of an isolated system is conserved."),
("Predict interaction","Like charges repel and unlike charges attract. A charged object can also attract a neutral object by redistributing its charges; attraction alone does not prove opposite net charges."),
("Detect and discharge","An electroscope responds to separated charges. A conducting path to Earth can remove excess charge. Lightning is an electrical discharge following large charge separation.")],
"Charge is measured in coulombs (C).",
"Protons do not normally transfer between rubbed objects.",
"If a neutral object gains electrons, what is its net charge?","Negative.","static",
[])
chapter("P08","Current, voltage & resistance","Connect charge flow, energy transfer and resistance.",[
("Define the quantities","Current is the rate of charge flow. Potential difference is energy transferred per unit charge. Conventional current points in the direction positive charge would move; electron drift in a metal is opposite."),
("Measure correctly","An ammeter goes in series with the component. A voltmeter goes across the component, in parallel. Resistance equals potential difference divided by current at that operating point."),
("Use a model","For an ohmic conductor at constant temperature, current is proportional to potential difference. A longer wire of the same material and thickness has greater resistance; a thicker wire has less.")],
r"\(I=\frac Qt,\quad V=IR\)",
"Use amperes rather than milliamperes when substituting into V=IR.",
"How much current flows through 6 Ω with 12 V across it?","2 A.","circuits",
[("6888-2020-2","7(b)",9,"Find a current using resistance and potential difference.")])
chapter("P09","Electric circuits","Apply the rules for series and parallel connections.",[
("Trace the path","A series circuit has one path, so every component carries the same current. Potential differences add to the supply potential difference."),
("Recognise branches","Parallel branches share the same potential difference. Current entering a junction equals total current leaving. Adding a parallel path lowers the effective resistance."),
("Check the answer","Series resistance is the sum. For two parallel resistors, use R₁R₂/(R₁+R₂). The result must be less than either individual resistance.")],
r"\(R_s=R_1+R_2,\quad R_p=\frac{R_1R_2}{R_1+R_2}\)",
"Do not add parallel resistances directly.",
"Why do household lamps work independently when wired in parallel?","Each has its own branch across the supply; one open branch does not break the others.","circuits",
[("6888-2020-2","7",9,"Resistance, current, voltage and power in a circuit.")])
chapter("P10","Practical electricity","Calculate electrical power and explain protection.",[
("Connect energy and charge","Electrical power is potential difference times current. Energy transferred is power times time. Use seconds for joules and hours with kilowatts for kilowatt-hours."),
("Understand protection","A fuse melts when current exceeds its rating for sufficient time. It belongs in the live conductor. An earth connection gives fault current a low-resistance path; double insulation provides another protective design."),
("Explain hazards","Damaged insulation can expose a live conductor; excess current overheats wires. Water and damp conditions increase shock risk. Study wiring with diagrams and supervised low-voltage models, not live mains.")],
r"\(P=IV,\quad E=IVt\)",
"A kilowatt-hour is a unit of energy, not power.",
"Why is a switch placed in the live conductor?","Opening it disconnects the appliance from the live supply.","circuits",
[("6888-2021-2","11",15,"Circuit connection, live wire and heater current.")])
chapter("P11","Magnetism","Represent magnetic fields and explain induced magnetism.",[
("Use poles","Like magnetic poles repel and unlike poles attract. Repulsion is evidence that both objects are magnets; attraction can also involve an unmagnetised magnetic material."),
("Read field lines","Outside a bar magnet, field direction runs from north to south. Closer lines show a stronger field. Field lines do not cross."),
("Compare materials","Soft iron magnetises and demagnetises readily, making it useful for electromagnets. Steel tends to retain magnetism. Domain alignment provides a simple model of magnetisation.")],
"Outside a magnet: N → S.",
"An induced pole nearest a magnet is the opposite pole.",
"Why is soft iron useful as an electromagnet core?","It magnetises strongly and loses most of that magnetism when current is switched off.","magnet",
[("6888-2021-1","13",9,"Induced magnetism and pole identification.")])
chapter("P12","Digital electronics","Use logic gates and truth tables.",[
("Separate signal types","An analogue signal varies continuously. A digital signal uses distinct states, here represented by 0 and 1."),
("Apply gate rules","NOT reverses one input. AND outputs 1 only when both inputs are 1. OR outputs 1 when at least one input is 1. NAND and NOR invert the AND and OR results respectively."),
("Build a truth table","List all four input pairs for two inputs: 00, 01, 10, 11. Work through a combined circuit one gate at a time, recording intermediate outputs.")],
"AND: both. OR: at least one. NOT: invert.",
"OR includes the case where both inputs are 1.",
"What is the output of a NAND gate when both inputs are 1?","0: AND gives 1, then NOT reverses it.","logic",
[])
chapter("P13","Electromagnetic effects","Connect currents, fields, motors, generators and transformers.",[
("Create a field","Current in a wire creates a magnetic field. More turns, greater current or a suitable iron core can strengthen an electromagnet."),
("Explain energy conversion","A current-carrying wire in a magnetic field can experience a force: the motor effect. A changing magnetic flux through a circuit can induce an e.m.f.: the generator effect. The induced effect opposes the change causing it."),
("Use a transformer","An alternating primary current creates changing flux in the core and an induced secondary voltage. The voltage ratio equals the turns ratio. Ideal input and output powers match; real transformers have losses.")],
r"\(\frac{V_p}{V_s}=\frac{N_p}{N_s},\quad V_pI_p=V_sI_s\ \text{(ideal)}\)",
"A steady direct current does not maintain transformer action.",
"Does a step-down transformer have more or fewer secondary turns?","Fewer secondary turns than primary turns.","magnet",
[("6888-2020-2","9",12,"Transformer ratio and ideal power.")])
chapter("P14","Atomic physics & radioactivity","Track nuclear changes and repeated half-lives.",[
("Read nuclear notation","The upper number A counts nucleons and the lower Z counts protons. Isotopes differ in neutron number. Nuclear changes must balance nucleon number and charge."),
("Compare emissions","Alpha particles are helium nuclei with strong ionisation and low penetration. Beta-minus particles are electrons emitted in nuclear decay. Gamma is electromagnetic radiation with high penetration."),
("Use half-life","Half-life is the time for half the undecayed nuclei in a large sample to decay. After each half-life, halve the remaining quantity again. Subtract background from count rate before comparing a source's activity.")],
r"\(N=N_0(1/2)^n,\quad n=t/T_{1/2}\)",
"Half-life does not mean every nucleus lasts the same fixed time.",
"What fraction remains after three half-lives?","1/8 of the original undecayed nuclei.","atom",
[("6888-2021-1","7",6,"Balance a nuclear decay equation.")])
chapter("P15","LEDs & flat-screen monitors","Connect semiconductor junctions to coloured pixels.",[
("Describe an LED","A light-emitting diode uses a semiconductor p–n junction. With a suitable forward voltage, electrons and holes recombine and release energy as light."),
("Control light","An LED conducts readily in the forward direction and needs current control. Its colour depends on semiconductor properties, not simply the colour of a plastic case."),
("Build a picture","Direct-emitting displays combine many red, green and blue subpixels with controlled brightness to form colours and images. Some displays marketed as LED monitors instead use LEDs as a backlight behind an LCD; distinguish the two designs.")],
"LED = light-emitting diode.",
"An ordinary diode need not emit visible light.",
"How can red, green and blue subpixels produce a white-looking pixel?","By emitting suitable amounts of all three colours together.","led",
[])

resources=[]
def resource(id,title,url,kind,provider,note,terms):
    resources.append(dict(id=id,title=title,url=url,kind=kind,provider=provider,note=note,
        terms=terms,topics=[c["id"] for c in lessons if c["resource"]==id]))
resource("fractions","Fractions","https://www.mathsisfun.com/fractions.html","Article","Math is Fun","Review equivalent fractions and common denominators.",["fractions","common denominator"])
resource("percent","Percentages","https://www.mathsisfun.com/percentage.html","Article","Math is Fun","Review percentages as parts out of 100.",["percentages","percentage change"])
resource("algebra-video","Algebra basics","https://www.youtube.com/watch?v=NybHckSEQBI","Video","Math Antics","A short introduction to variables and algebra. Opens YouTube.",["algebra","like terms"])
resource("quadratic-video","Solving quadratic systems graphically","https://en.khanacademy.org/math/algebra-home/alg-quadratics/alg-systems-of-quadratic-equations/v/non-linear-systems-of-equations-1","Video","Khan Academy","Extended Mathematics: connect a line and a quadratic graph to their simultaneous solutions.",["quadratic systems"])
resources[-1]["topics"]=["M18","M20"]
resource("coordinates","Straight-line graphs","https://www.mathsisfun.com/algebra/linear-equations.html","Article","Math is Fun","Reconnect equations, gradients and plotted points.",["gradient","linear equation"])
resource("pythagoras","Pythagoras' theorem","https://www.mathsisfun.com/pythagoras.html","Article","Math is Fun","Review the right-triangle side relationship.",["Pythagoras","Pythagorean theorem"])
resource("trig","Sine, cosine & tangent","https://www.mathsisfun.com/sine-cosine-tangent.html","Article","Math is Fun","Name the sides before choosing a ratio.",["trigonometry","SOHCAHTOA"])
resource("construction","Geometrical constructions","https://www.mathsisfun.com/geometry/constructions.html","Article","Math is Fun","Animated ruler-and-compasses constructions.",["perpendicular bisector","construction"])
resource("derivative","Differentiation","https://www.mathsisfun.com/calculus/derivatives-introduction.html","Article","Math is Fun","Read the polynomial examples first; later sections extend beyond EGCSE.",["differentiation","derivative"])
resource("matrices","Matrix multiplication","https://www.mathsisfun.com/algebra/matrix-introduction.html","Article","Math is Fun","Review matrix order and row-by-column products.",["matrix multiplication","matrices"])
resource("probability","Probability","https://www.mathsisfun.com/data/probability.html","Article","Math is Fun","Refresh equally likely outcomes and sample spaces.",["probability"])
resource("statistics","Mean, median & mode","https://www.mathsisfun.com/mean.html","Article","Math is Fun","Start with the arithmetic mean, then follow the linked averages.",["mean","average"])
resource("matter","Classifying matter","https://openstax.org/books/chemistry-2e/pages/1-2-phases-and-classification-of-matter","Book","OpenStax","A free textbook section on substances, mixtures and physical states.",["mixture","physical change"])
resource("particles","Particles & states","https://phet.colorado.edu/en/simulations/states-of-matter-basics","Simulation","PhET · University of Colorado","Observe particle arrangement as temperature changes.",["particle model","diffusion"])
resource("atom","Atomic structure","https://phet.colorado.edu/en/simulations/build-an-atom","Simulation","PhET · University of Colorado","Build atoms and ions by changing protons, neutrons and electrons.",["atomic structure","isotopes"])
resource("moles","Moles & reacting amounts","https://openstax.org/books/chemistry-2e/pages/4-3-reaction-stoichiometry","Book","OpenStax","Work through the mass-to-moles and mole-ratio examples.",["stoichiometry","moles"])
resource("reactions","Chemical reactions","https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions","Book","OpenStax","Review acid-base, precipitation and redox reactions.",["redox","oxidation","reduction"])
resource("acids","Balancing chemical equations","https://phet.colorado.edu/en/simulations/balancing-chemical-equations","Simulation","PhET · University of Colorado","Practise conserving atoms in chemical equations.",["balanced equation","balancing equations"])
resource("electrolysis","Electrolysis","https://cognito.org/cheat-sheets/gcse-chemistry/electrolysis","Notes","Cognito","A targeted explanation of ions and electrodes.",["electrolysis","cathode","anode"])
resource("circuits","Series & parallel circuits","https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc","Simulation","PhET · University of Colorado","Explore voltage and current in a virtual low-voltage circuit.",["Ohm's law","parallel circuit","series circuit"])
# Textbook links below are overridden with verified topic pages.
for id,title,terms in [
    ("measurement","Measurement & units",["density","measurement"]),
    ("motion","Motion graphs",["acceleration","velocity"]),
    ("forces","Forces & moments",["resultant force","moment"]),
    ("energy","Work & energy",["kinetic energy","potential energy"]),
    ("waves","Waves",["wavelength","frequency"]),
    ("thermal","Thermal transfer",["convection","conduction"]),
    ("static","Electric charge",["electrostatics","electric charge"]),
    ("magnet","Magnetic fields",["magnetism","transformer"]),
    ("logic","Logic gates",["logic gates","truth table"]),
    ("led","Light-emitting diodes",["LED","semiconductor"]),
    ("organic","Organic compounds",["organic chemistry","polymerisation"]),
]:
    # Specific section URLs are supplied in resource_overrides.json.
    resource(id,title,"https://openstax.org/details/books/physics","Book","OpenStax","Free supplementary reading. Use the chapter's syllabus outline to set the required depth.",terms)

overrides=ROOT/"resource_overrides.json"
if overrides.exists():
    for r in resources:
        override=json.loads(overrides.read_text()).get(r["id"])
        if override:r.update(override)

def build():
    content=dict(edition="2024–2026",checked="2026-09-23",syllabus=SYLLABUS,lessons=lessons,papers=papers,resources=resources,examples=[])
    (ROOT/"assets/content.js").write_text("window.STUDY_CONTENT = "+json.dumps(content,ensure_ascii=False,indent=2)+";\n")
    import csv
    with (ROOT/"CHAPTER-SOURCES.csv").open("w",newline="") as f:
        writer=csv.writer(f)
        writer.writerow(["Chapter","Title","Subject","Syllabus topic","Edition","Syllabus link","Exam code","Session","Paper","Question","PDF page","Original paper link"])
        for c in lessons:
            base=[c["id"],c["title"],c["subject"],c["syllabusTopic"],"2024–2026",SYLLABUS[c["subject"]]]
            if not c["refs"]:
                writer.writerow(base+["No verified question","","","","",""])
            for ref in c["refs"]:
                p=next(p for p in papers if p["id"]==ref["paper"])
                writer.writerow(base+[p["code"],p["session"]+" "+str(p["year"]),p["number"],ref["question"],ref["page"],p["url"]+"#page="+str(ref["page"])])
    print(f"Built {len(lessons)} chapters, {len(papers)} papers and {len(resources)} resources.")

if __name__=="__main__":build()
