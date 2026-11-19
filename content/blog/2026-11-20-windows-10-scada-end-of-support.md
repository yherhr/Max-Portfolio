---
title: "Windows 10 end of support on SCADA and HMI PCs: what a small plant should do"
seo_title: "Windows 10 End of Support on SCADA and HMI PCs"
description: Windows 10 end of support on SCADA and HMI PCs. Which editions are already out of support, the LTSC dates that matter, and how to plan the change safely.
date: 2026-11-20
---

Windows 10 end of support has already happened for most PCs. Support for Windows 10 Home and Pro, version 22H2, [ended on 14 October 2025](https://learn.microsoft.com/en-us/lifecycle/products/windows-10-home-and-pro). The office laptop got the upgrade prompt and moved on. The SCADA and HMI PCs on the plant floor usually did not, because nobody wanted to touch a machine that runs production.

The short answer: find out exactly which edition of Windows each plant PC runs, because the dates are very different. Then check what your SCADA or HMI software version supports, take a full backup, and plan the change around a shutdown instead of a failure.

## Which Windows 10 edition is on your SCADA PC?

This is the part people skip, and it decides everything else. "Windows 10" covers several editions with their own support dates. On each PC, press the Windows key, type `winver` and press Enter. The window that opens shows the edition and version. Write it down for every machine: SCADA servers, operator stations, the engineering laptop, and any panel PC that runs an HMI.

Here are the dates for the editions I see most often on plant PCs, from Microsoft's own lifecycle pages:

| Edition | Security updates end |
|---|---|
| [Windows 10 Home and Pro, 22H2](https://learn.microsoft.com/en-us/lifecycle/products/windows-10-home-and-pro) | Ended October 2025 (paid extended updates available) |
| [Windows 10 Enterprise LTSC 2021](https://learn.microsoft.com/en-us/lifecycle/products/windows-10-enterprise-ltsc-2021) | January 2027, with paid extended updates listed to January 2030 |
| [Windows 10 Enterprise LTSC 2019](https://learn.microsoft.com/en-us/lifecycle/products/windows-10-enterprise-ltsc-2019) | January 2029 |
| [Windows 10 IoT Enterprise LTSC 2021](https://learn.microsoft.com/en-us/lifecycle/products/windows-10-iot-enterprise-ltsc-2021) | January 2032 |
| [Windows 11 IoT Enterprise LTSC 2024](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-iot-enterprise-ltsc-2024) | October 2034 |

Two things stand out. Windows 10 Enterprise LTSC 2021 has a much shorter life than the 2019 release before it, and it ends in under two months. The IoT Enterprise version of the same release runs five years longer. They look almost identical on screen, so check the wording in `winver` carefully. An industrial PC that came with Windows preinstalled may well be the IoT edition, but check rather than assume.

If a PC says Pro, it has been without free security updates for over a year.

## Does the PC stop working?

No. Microsoft says plainly that Windows 10 PCs [will continue to work](https://learn.microsoft.com/en-us/windows/whats-new/extended-security-updates) after support ends. What stops is security fixes, bug fixes and technical support. Your SCADA keeps running the morning after the deadline exactly as it did the night before.

That is why these machines get left alone. The risk is not a sudden stop. It is a slow build-up of known security holes on a PC that is connected to your controllers, often with a remote access tool on it so someone can check the plant from home.

## Extended Security Updates: a bridge, not a fix

Microsoft sells Extended Security Updates (ESU) for organisations still on Windows 10. Going by [Microsoft's ESU page](https://learn.microsoft.com/en-us/windows/whats-new/extended-security-updates):

- It costs US$61 per device for the first year, and the price doubles each year after that.
- It runs for a maximum of three years after end of support.
- It is cumulative. If you join in year two, you pay for year one as well.
- The PC must be on Windows 10 version 22H2.
- It gives security updates only. No new features, no general technical support.

For a site with two or three SCADA PCs, ESU can be a reasonable way to buy time while the software and hardware are sorted out. It is not worth paying for three years and then still facing the same upgrade. Use it to cover a plan, not to replace one.

## The real constraint: what your SCADA software supports

On an office PC you upgrade Windows and get on with your day. On a SCADA PC, the question is whether your SCADA version is supported on the new operating system. Getting that wrong can mean drivers that will not load, licences that will not activate or screens that will not open.

Citect is a good example because it is common around the region. Schneider says Windows 11 was tested with [Plant SCADA 2023, Plant SCADA 2020 R2 and Citect SCADA 2018 R2](https://www.se.com/it/it/faqs/FAQ000258766/), the versions it listed as supported when that note was written. If your site is running an older Citect release, moving to Windows 11 usually means upgrading the SCADA as well. That is a project, not a weekend job.

The same applies to other vendors. Before you change anything, find:

1. The exact version of your SCADA or HMI software, from its About screen.
2. The vendor's compatibility list for that version.
3. The version of the PLC programming software on the engineering laptop, which has its own list.
4. Any drivers, OPC servers or add-ons the project relies on.

If the version you run is not supported on anything current, that tells you the upgrade is really a SCADA upgrade with a Windows change attached.

## A sensible order of work for a small site

None of this needs to happen in a panic. It does need to happen in the right order.

1. **List every plant PC.** Name, job, Windows edition from `winver`, and the SCADA or HMI version on it.
2. **Back up properly.** A full disk image of each PC, plus a separate export of the SCADA project, licence details and configuration. Check the backup opens on another machine. A plant PC that dies with no image can take days to rebuild.
3. **Cut down what can reach it.** A SCADA PC does not need email or general web browsing. Remove remote access tools that nobody uses, and make sure the plant network is kept apart from the office network.
4. **Decide per machine.** Stay on a supported LTSC edition, pay for ESU to bridge a gap, or move to new hardware with a supported Windows and SCADA version.
5. **Test before the shutdown.** Build the new PC on the bench, restore the project, and check comms to the controllers before it goes anywhere near the plant.
6. **Change over in a planned window.** Keep the old PC intact and ready to put back until the new one has run through a full production cycle.

This is the same approach I use for any change to running plant, written up on my [automation page](/automation.html): back up first, write down the change, test off the plant, commission with the operators and leave it documented.

## How this ties in with old controllers

Plant PCs and PLCs tend to age together. A site still running Windows 10 Pro on its SCADA PC often has a controller that is near end of life as well. If that is you, my post on [PLC end of life](/blog/plc-end-of-life.html) covers the controller side. It is often cheaper to plan both changes into one shutdown than to take the plant down twice.

## Getting help in the Central West

I am a control systems engineer based in Bathurst. I work mainly with Schneider controllers in Control Expert, Citect SCADA and the AVEVA PI System, and I take on smaller jobs that a big integrator will not prioritise. My background is on the [about page](/about.html) and the towns I cover are on the [service areas page](/locations.html). I do not do electrical installation; your electrician handles anything that needs a licence.

If you are not sure what your plant PCs are running, send me the `winver` details for each one, the SCADA or HMI version and what each machine does. I will tell you plainly where you stand and whether it is a job for me. [Get in touch](/contact.html).
