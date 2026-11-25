---
title: "PLC program backup: how to know you could restore your plant tomorrow"
seo_title: "PLC Program Backup: A Checklist for Small Plants"
description: A PLC program backup is only useful if it restores. What a full backup includes, where comments get lost, battery-backed memory, and how to test it.
date: 2026-11-25
---

A PLC program backup is the cheapest insurance a small plant can buy, and the one most often missing. Most sites think they have one. What they usually have is a file on a laptop from the last time someone made a change, and nobody knows whether it matches what is running now.

The short answer: upload what is actually in the controller, keep the original project file with its comments alongside it, back up the HMI, SCADA and drives as well, store copies in two places, and prove the backup opens before you need it. Do it again after every change.

## Why a PLC program backup matters more than it looks

When a controller loses its program, nothing can be fixed until the program is back. The technician can replace the CPU in ten minutes. Without a copy of the program, the new CPU is an empty box.

The numbers from people who have been through it are not small. SAGE Automation describes a site where a deleted PLC program had to be [rewritten from scratch over two weeks](https://gotosage.com/insights/blog/backup-basics-plc-backups-will-save-you-money), with downtime they put at upwards of $200,000. The same article says taking a backup usually takes them under an hour. That is the trade.

Around the Central West, the plant where this bites is rarely new. It is the pump station, the batching plant, the packaging line or the timber mill that was commissioned years ago by a builder or integrator who has since moved on. The program works, so nobody has looked at it. That is exactly why the copy is out of date.

## What a complete backup includes

The PLC logic is the obvious part. It is not the whole system. SAGE's list of what to back up covers [PLCs, HMIs, SCADA systems, VSDs, industrial PCs and network configurations](https://gotosage.com/insights/blog/backup-basics-plc-backups-will-save-you-money), and that matches what you need to rebuild a plant from bare hardware.

| Part of the system | What to keep |
|---|---|
| PLC | The project file from the engineering software, plus a fresh upload from the controller |
| HMI or operator panel | The panel project, not just a screenshot of the screens |
| SCADA | The project export, configuration, and licence details |
| Variable speed drives | The parameter file for each drive, saved from the drive software or keypad |
| Plant PCs | A full disk image, as covered in my [Windows 10 SCADA post](/blog/windows-10-scada-end-of-support.html) |
| Network | IP addresses, switch configuration and anything with a fixed address |
| Notes | Software name and version, firmware versions, passwords and who holds them |

The software version is the one people forget. Older controllers often need an older version of the engineering software to open the project, and sometimes an old laptop with a serial port to run it. If you have the file but nothing that can open it, you do not really have a backup.

## Upload versus project file: where the comments go

There are two different things that both get called "the program".

The **project file** is what the programmer worked on. It has the comments, the tag descriptions and the notes that explain why a rung does what it does. The **controller** holds what is actually running. Depending on the platform and how it was set up, it may hold much less than the project file.

On Schneider controllers programmed in Control Expert, there is a project setting called upload information. Schneider's own support note says that if it was not turned on when the project was downloaded, the project [cannot be uploaded from the controller](https://www.se.com/ae/en/faqs/FA403638/) at all. Other brands have their own versions of the same trap: an upload can bring back working logic with no comments, which runs fine but is slow and risky to change.

So keep both. Upload from the controller to capture what is really running, and keep the matching project file with its documentation. If they do not match, find out why before you trust either one.

## Battery-backed memory on older PLCs

Many older controllers keep their program in memory that needs a battery to survive a power cut. Control Design ran a piece this year on exactly this, noting that older PLCs [used batteries to keep their memory alive](https://www.controldesign.com/control/plcs-pacs/article/55365139/preventing-plc-memory-loss-essential-maintenance-and-modern-solutions), while modern ones generally do not. In the case they describe, a dead battery and a power cycle took a wastewater plant down for about 15 hours.

Two things follow from that:

- **Check the battery on a schedule.** Most controllers show a battery warning light or a status bit. Put a battery check on the maintenance calendar and keep a spare in the cabinet.
- **Be careful around power work.** If the battery is flat, switching off the cabinet for an electrical job can be the moment the program goes. Take a backup before any planned shutdown, every time.

If your plant is still on a controller that relies on a battery, it is probably also one of the ranges going out of support. My [PLC end of life post](/blog/plc-end-of-life.html) has the dates for the common ones.

## How often, and where to keep it

**How often:** after every change, and on a regular schedule even if nothing has changed, so you know the copy matches. A plant that is never touched still needs a copy checked at least once.

**Where:** at least two places, with one of them off site. A USB stick in the control cabinet is handy, but it shares the same risks as the controller. A copy on the office network, or in cloud storage the business controls, covers the rest. Keep each copy named with the date and what changed, so the newest one is obvious.

**Who can change it:** Australia's Essential Eight guidance, as set out in the Australian Signals Directorate's [notes on regular backups](https://blueprint.asd.gov.au/security-and-governance/essential-eight/regular-backups/), says ordinary user accounts should be prevented from modifying or deleting backups. That is written for IT, but it applies just as well to the plant folder on a shared drive.

## Test the backup: the step everyone skips

A backup that has never been opened is a guess. The same ASD guidance says every maturity level expects [disaster recovery exercises that test restoring from backups](https://blueprint.asd.gov.au/security-and-governance/essential-eight/regular-backups/). On a small plant, that does not need to be elaborate:

1. Open the backup on a different PC from the one that made it.
2. Compare it with the running controller using the engineering software's compare tool, where there is one.
3. Check the comments and descriptions are there.
4. Check the drive and HMI files open in their own software.
5. Write down the date, who checked it and what software version was used.

If the compare shows differences you cannot explain, that is worth knowing now rather than during a breakdown.

## Who owns the program?

If an outside builder or integrator wrote your program, check the contract and the handover documents. Some suppliers hand over the full project file, some lock parts of it with a password, and some keep it. You are entitled to ask what you received. The time to ask is while the supplier is still answering the phone.

The same goes for passwords. If the controller or parts of the program are password protected, the business should hold those passwords, written down somewhere safe, not just in one contractor's head.

## Getting a backup done in the Central West

Backing up is the first step on every job I do, before anything else is touched. It is written into how I work on running plant, set out on my [automation page](/automation.html). I mostly work on Schneider controllers in Control Expert, with Citect SCADA and the AVEVA PI System, and I cover the towns on the [service areas page](/locations.html).

If you are not sure whether your plant has a usable backup, send me the make and model of the controller, what it runs and whether you have any project files. I will tell you plainly whether it is one for me. [Get in touch](/contact.html).
