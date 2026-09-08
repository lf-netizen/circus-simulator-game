# Single-location slice: implemented rules

One generated 20 × 20 site, one cashbox, and a repeating preparation → operating day → report loop. There is no travel, rival simulation, or season system.

## Preparation and building

Start with 22,000 zł, 32 L fuel, 80 L water, and 38 reputation. Planning does not advance time. The seed determines ponds, trees, rocks, and weather; the central field always has room for a viable starter circus.

Paths cost 15 zł per tile and must connect back to the entrance. Drag to paint; arrow keys and Enter also place or inspect tiles. Trees cost 40 zł to clear, rocks 100 zł; water is protected. Buildings occupy their full grid footprint and can rotate. Demolition returns half of construction and upgrade costs. A tent with pending bookings cannot be demolished until those bookings are cancelled.

| Purchase        | Footprint |      Price | Main effect                           |
| --------------- | --------- | ---------: | ------------------------------------- |
| Little big top  | 3 × 3     |   2,400 zł | 80 seats; 3 kW                        |
| Grand pavilion  | 4 × 4     |   5,800 zł | 180 seats; aerial acts; 5 kW          |
| Trailer         | 2 × 2     |     950 zł | Four beds; 1 kW                       |
| Generator       | 2 × 2     |     800 zł | 10 kW within six tiles; 4 L fuel/day  |
| Water tank      | 1 × 1     |     450 zł | Water service within six tiles        |
| Toilets         | 1 × 2     |     550 zł | +25 guest comfort when operational    |
| Popcorn         | 2 × 1     |     650 zł | Staffed concessions; 1 kW             |
| Lemonade        | 1 × 1     |     400 zł | Staffed concessions                   |
| Carousel        | 2 × 2     |   1,600 zł | Staffed attraction; +10 comfort; 2 kW |
| Bench / flowers | 1 × 1     | 90 / 60 zł | Nearby comfort, up to +15 total       |

Utilities must connect to the entrance. Generators allocate finite power to buildings within range; a second tent may need another generator. Available fuel and water must cover the day's operation. Stock is purchased during preparation: 20 L fuel costs 160 zł and 40 L water costs 80 zł. Water use is at least 4 L, otherwise 2 L per hired person plus 8 L per scheduled show.

Food services add 10 comfort. Connected scenery near tents adds 3 comfort each, capped at 15. Base comfort is 40. Seating upgrades cost 600 zł, add 20% capacity and 0.2 predicted stars, once per tent.

## People and performances

Ten candidates span clown, juggler, acrobat, magician, technician, and vendor roles. Hiring costs two daily wages. Every hired person is paid at closing, even if idle. Technicians and vendors need explicit, role-compatible workplaces. Each tent needs its own technician; one employee cannot hold two jobs. Trailers have four assignable beds.

Training costs 120 zł, grants four skill points, and uses 12 energy. Performer skill, morale, fatigue, and technician skill affect show quality. Vendors' skill affects concession sales. Technicians spend 12 energy per show at their tent and working vendors spend 8 per completed show at closing. Support workers need at least 15 energy to operate.

Book today or up to six days ahead. Tickets cost whole amounts from 10–60 zł. Programmes contain 3–8 distinct segments lasting 60–120 minutes. An interval cannot open or close the show; aerial acts require a grand pavilion. Tents and performers cannot overlap. Projected performer energy must cover the day's acts before the gates can open.

Shows may start from 10:00–20:00 and must finish by 22:00. Normal acts last 25 minutes, aerials 30, intervals 15. Running order matters: sustained excitement has a fatigue penalty, while clowning or an interval resets the build-up.

Attendance depends on capacity, price, reputation, comfort, weather, crew quality, repeat performances, and marketing. All tents share a finite daily market: 180 + twice reputation + twice the current poster boost, reduced by 15% in rain. Earlier shows consume this pool; simultaneous shows share it proportionally. A 200 zł poster campaign improves demand and adds up to 30 potential daily admissions; maximum three campaigns, reset tomorrow. The forecast explains these limits.

## Operating day and settlement

Opening starts the clock at 09:00. Each simulation tick advances five game minutes. The controls pause or run at 1×, 3×, or 6×. Construction, hiring, training, bookings, and deliveries are restricted to preparation.

Shows start at their booked time. Animated groups take routes on the actual connected paths to tents and services. The visitors are visual representatives of paid admissions, not separately simulated individuals with wallets and needs.

A scripted spotlight failure pauses the day's first show. Repair costs 180 zł and protects its rating; improvisation is free and costs 0.35 stars. Ticket and concession revenue settle when shows finish. Performance energy is consumed, and ratings change reputation.

At 22:00, deduct all wages and daily building maintenance plus 180 zł ground rent. Consume fuel and water from purchased stock. Operating profit includes ticket and concession income minus wages, upkeep, and emergency repairs. Construction, recruitment, training, posters, and resource deliveries were paid when ordered and are excluded from this report; stock is not charged twice.

Prepare tomorrow restores 40 energy and three morale in quiet serviced housing, 25 energy in noisy or unserviced housing, or 15 energy with an eight-morale penalty outdoors. Generators within four tiles disturb trailers.

Reach 300 admissions, six completed shows, and 60 reputation while solvent to complete the local milestone, then continue the sandbox. Zero cash ends the attempt. Export and import preserve the location and its operating state; loading always starts paused.
