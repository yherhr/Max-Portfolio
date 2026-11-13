---
title: "PLC end of life: what to do when the controller running your plant is obsolete"
seo_title: "PLC End of Life: What to Do When Yours Is Obsolete"
description: What PLC end of life means for a small plant, the dates for Modicon Premium, Quantum, S7-300 and SLC 500, and what to do before something fails.
date: 2026-11-14
---

PLC end of life does not mean your plant stops tomorrow. It means the manufacturer has stopped making the controller, and at some point after that they stop repairing it, supplying spares and answering questions about it. The plant keeps running until a part fails. Then the question is whether you can get another one, and how long the line is down while you look.

The short answer: find out exactly what hardware you have, back up the program today, buy a spare for anything that would stop production, and plan the upgrade on your timeline rather than the failure's.

That applies to a lot of plant around the Central West. Pump stations, packaging lines, batching systems, abattoirs, quarries and timber mills often run on controllers that were installed fifteen or twenty years ago and have not needed attention since. That reliability is the problem. Nobody thinks about the PLC until the day it dies.

## What PLC end of life actually means

Each manufacturer uses its own words, but the stages are much the same:

1. **Active.** Sold, supported, and the current product.
2. **Phase-out or end of commercialisation.** No longer recommended for new projects. Stock may still be sold for a while.
3. **Discontinued.** No longer made or sold new. Spares may still be available from the manufacturer for a set period.
4. **End of service.** No repairs, no spares, no technical support from the manufacturer. After this you rely on second-hand parts, repairers and whoever still knows the platform.

The dates also vary part by part, not just range by range. A CPU can be discontinued years before the I/O cards that sit beside it. Checking one part number tells you about that part only.

## Dates for some common controllers

These are common platforms in older plant around the region. Check your own part numbers with the manufacturer before planning anything, because individual modules have their own dates.

- **Schneider Modicon Premium.** End of commercialisation announced December 2018, end of standard service support [31 December 2026](https://www.cofiem.fr/en/new/41-end-of-service-for-the-modicon-premium-range-by-schneider-electric.html). Schneider lists the same end-of-service date for a [Premium safety module](https://www.se.com/nl/en/product/TSXPAY262/preventa-safety-module-modicon-premium-19-2-to-30vdc-30ma-5w).
- **Schneider Modicon Quantum.** Dates vary by module. For example, the [140NOM21100C head-end adaptor](https://www.se.com/ca/en/product/140NOM21100C/modicon-quantum-dio-headend-adaptor-twisted-pair-cable-medium) was discontinued on 8 August 2025, with end of service on 31 December 2029.
- **Siemens S7-300 and ET 200M.** [Phase-out from 1 October 2023](https://automationtrader.com/en/knowledge/blog/the-end-of-an-era-siemens-simatic-s7-300-reaches-its-final-stage), end of standard deliveries 1 October 2025, spare parts typically until around 2033.
- **Allen-Bradley SLC 500.** [Discontinued date of 31 March 2024](https://de.prosoft-technology.com/insights/products-focus/The-SLC-500-is-Being-Discontinued-Are-You-Ready) announced for the remaining controllers.

If your plant runs on Modicon Premium, the end of standard service is about seven weeks away as I write this. That is not a reason to panic, but it is a reason to stop putting off the conversation.

## What to do first, before anything fails

None of these steps commit you to an upgrade. They make sure a failure is a bad day rather than a bad month.

1. **Write down what you have.** Every controller, power supply, comms card and I/O module, with its full part number from the label. Take a photo of each rack with the labels readable. Note the software and version used to program it.
2. **Get a verified backup of the program.** Not the copy on a laptop that left with the last contractor. Upload what is actually running in the controller, save it in two places, and check it opens. If there are drives, HMIs or SCADA screens, back those up as well.
3. **Check the lifecycle status of each part number.** Schneider shows it on each product's page on its website, with discontinued and end-of-service dates. Siemens and Rockwell publish the same kind of status, searchable by part number.
4. **Decide which failures would stop production.** A dead CPU or power supply usually stops everything. A single I/O card might be workable for a day with a temporary bypass. Be honest about which is which.
5. **Buy spares for the parts that matter.** While parts can still be bought new or from a reputable repairer, a spare CPU and power supply on the shelf is cheap insurance. Test spares when they arrive, and keep them with a copy of the program.
6. **Find out who can actually work on it.** Older platforms often need older software, and sometimes an old laptop with a serial port to run it. If nobody in your area can connect to your controller, that is a risk on its own.

## Repair, replace or migrate

Once you know what you have, there are three broad paths.

**Keep it running.** Spares, repairs and second-hand parts can carry a stable plant for years. This suits equipment that is itself near the end of its life, or a site that is likely to change in the next few years anyway. The risk grows every year as parts get harder to find.

**Swap the controller and keep the field wiring.** Most manufacturers sell a migration path to their current range, and some offer adaptors that let new hardware reuse existing wiring. The recommended path for Modicon Premium is the [Modicon M580](https://www.cofiem.fr/en/new/41-end-of-service-for-the-modicon-premium-range-by-schneider-electric.html), and for the S7-300 it is the [S7-1500](https://www.eichler-service.com/en/magazine/article-search/articles/simatic-s7-300-et-200m-type-discontinuation-pm410-effective-october-2025). The program is converted and tested, then the change-over happens in a planned shutdown. This is usually the least disruptive full fix.

**Rebuild the control system.** If the plant has changed a lot since it was built, or nobody understands the old program any more, a cleaner rewrite can cost less over time than converting years of patches. It takes longer and needs more testing, so it suits a planned project rather than an emergency.

Whichever path you choose, the order of work does not change: back up first, document the change, test off the plant where possible, commission with the operators, and leave it documented. That is how I work on any running plant, as set out on my [automation page](/automation.html).

## What a planned migration looks like on a small site

For a single-rack controller running a pump station or a packaging line, the job usually breaks into:

- **Survey.** Confirm the hardware, the program, the comms to other equipment and what the operators rely on.
- **Convert and test.** Convert the program to the new platform, then test it in simulation or on a bench before it goes near the plant.
- **Shutdown.** Swap the hardware in a planned window. Your electrician handles anything that needs a licence.
- **Commission.** Run it with the operators watching, check every input, output and alarm, and confirm it behaves the way the old system did.
- **Hand over.** Updated program comments, a change note and current backups.

The planning is what keeps the shutdown short. A plant that has already done the first six steps above is a long way ahead.

## Getting help in the Central West

I am a control systems engineer based in Bathurst and I do smaller automation jobs for local industry, mostly on Schneider controllers in Control Expert, with Citect SCADA and the AVEVA PI System. My background is on the [about page](/about.html), and the towns I cover are on the [service areas page](/locations.html). I do not do electrical installation; your electrician does the wiring and I design, program, commission and document.

If you are not sure what your plant runs on or how exposed you are, send me the make and model of the controller, a photo of the rack and what it runs. I will tell you plainly whether it is one for me. [Get in touch](/contact.html).
