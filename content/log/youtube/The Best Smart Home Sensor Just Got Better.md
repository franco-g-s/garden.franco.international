---
created: '2025-09-25'
tags:
  - youtube
areas:
  - '[[log/youtube/index|YouTube]]'
  - Smart Home
title: The Best Smart Home Sensor Just Got Better
author:
  - The Stock Pot
url:
  - >-
    https://www.thestockpot.net/videos/the-best-smart-home-sensor-just-got-better
  - 'https://www.youtube.com/watch?v=FmZH3Svbjho'
published: '2025-05-30'
description: >-
  I took the Everything Presence One sensor from ‪@EverythingSmartHome‬ and made
  it even better, with a custom 3D printed ceiling mount and PoE power. Perfect
  presence sensing for every room.
language: en-US
image: 'https://img.youtube.com/vi/FmZH3Svbjho/maxresdefault.jpg'
---

![The Best Smart Home Sensor Just Got Better](https://www.youtube.com/watch?v=FmZH3Svbjho)  

> [!summary] Description:
> I took the Everything Presence One sensor from ‪@EverythingSmartHome‬ and made it even better, with a custom 3D printed ceiling mount and PoE power. Perfect presence sensing for every room.  

### Transcript
If you've spent any time trying to build the perfect smart home, you already know that sensors are everything.

Sure, turning lights on and off automatically is fun. But without reliable presence detection, climate control, and air quality data, your home isn't *smart* — it's just guessing. So when I came across a sensor from fellow YouTuber **Lewis from Everything Smart Home**, I thought I’d found the missing piece… almost.

The **Everything Presence One** sensor (EP1) is packed with features: motion, mmWave presence sensing, temperature, humidity, light levels — even CO₂, if you add the expansion module. But as much as I liked the tech inside, I wasn’t in love with how it was meant to be installed.  

### A Sensor That’s Smart — But Not Subtle
The stock EP1 case is tidy and well-designed, don’t get me wrong. But wall-mounted sensors with USB-C power cables dangling out the bottom just weren’t going to fly at my place. I’m chasing a *clean*, built-in smart home — not a science fair glued to every surface.

![](https://images.squarespace-cdn.com/content/v1/67b67e84acd1811dcbf19219/63e75ace-feba-4979-945d-1a7297eb985f/Original_Enclosure.jpg?)  
*The Everything Presence One*

I needed something that would:
- Mount cleanly in the ceiling  
- Look like it belonged there
- And could be powered without ugly USB cables

So I grabbed my calipers, fired up Fusion 360, and set out to build a better housing for the EP1.

### Designing a Ceiling-Mounted Upgrade
My plan was to replicate the look of our existing downlights so that the sensors would vanish into the ceiling. I took a few measurements from a spare light fitting, then modelled a new enclosure that would fit the EP1’s PCB and bubble lens — while leaving room for a hidden **Power over Ethernet (PoE)** adapter tucked neatly in the back.

![](https://images.squarespace-cdn.com/content/v1/67b67e84acd1811dcbf19219/ff495802-dd7e-4ce0-b76e-57623d922529/POEModule.jpg?)  
*The naked POE module*

After a few rounds of prototyping and a few *too-small-to-fit-through-the-hole* design failures, I landed on a design I’m genuinely happy with. The housing installs like a standard downlight, complete with spring clips — just push it in and you’re done.

It looks *nothing* like a smart sensor. And that’s exactly the point.

### Powering with PoE
To keep the install clean and eliminate wall warts, I used a dismantled PoE to 5V adapter hidden inside the enclosure. I used some little female dupont cables to the EP1's header pins, keeping everything compact and tidy.

![](https://images.squarespace-cdn.com/content/v1/67b67e84acd1811dcbf19219/09703328-aec8-414b-af61-7344046b77a2/Assembly.jpg?)  
*Installing the EP1 PCB*

Right now I’m only using PoE for power — but I’m *very* excited about the future version Lewis teased that will support Ethernet data too. When that releases, upgrading should be a plug-and-play swap.

![](https://images.squarespace-cdn.com/content/v1/67b67e84acd1811dcbf19219/ae13ae05-83d8-4421-be78-dd57de19c684/Installation.jpg?)  
*Installing the new downlight-like EP1 sensor*

### The Results
![](https://images.squarespace-cdn.com/content/v1/67b67e84acd1811dcbf19219/961a5d70-2003-4071-966e-297248cda35a/Sinished_Sensor.jpg?)  
*The completed sensor*

These new ceiling-mounted EP1s are already one of the most important parts of my smart home. With mmWave + motion sensing, I can reliably tell when someone’s in a room — even if they’re just sitting still reading a book. That data powers automations like:

- Activating aircon zones only in occupied rooms  
- Turning off lights when a room’s truly empty
- Alerting me when CO₂ levels get too high in bedrooms or the office

I also added a **temperature offset** to account for any heat the PoE module introduces — and now every stat is accurate, fast, and reliable.

---

## Want to Build Your Own?
I've uploaded the full 3D model, BOM, and notes to **Printables** for anyone who wants to make their own version.
### Parts
- [Everything Presence One Sensor](https://shop.everythingsmart.io/products/everything-presence-one-kit?srsltid=AfmBOoo10V6YpjqUPwBiSTcP4zyeelwaH_tbZ-FbFXML3mqdKixZ_nGh)
- [Anvision POE adapter](https://www.amazon.com.au/dp/B079D5JXNF?ref=ppx_yo2ov_dt_b_fed_asin_title)
- [Downlight springs](https://www.amazon.com.au/100PCS-Downlight-Circlip-Replacement-Accessories/dp/B0872BKTWX/ref=sr_1_8?dib=eyJ2IjoiMSJ9.__8ZZm5R7UeZHvOhpV6V6pPMXs_nZh15py-tOv69jehakasM6lHskbhwcZFA0M5v6Xyek6D52SEgQ6aryPqvFjx7jkKbHnhXjtKrtnxKtCkSnT5zbRlUfpNLodi5LCTViWplVHOfpXIG8u-eOymrr8Za688qhyCB5fiOBlnr96bNItKZMJtKFueMcOEHJq2LYCFJY1oQeTLhNK5ZDsp8Vq9R7msgQdKCrRnipppNxdnpSK4qQL7Rvw1-n-4w72INVKBOqiEQMlPguHaCXlLgqtCn7hDK8OY1GvGbQ3C0DE4.9Ujug0ogdtz9J0nLsjh3k1Q90LtqrqVohYc33shL0Ro&dib_tag=se&keywords=downlight+springs&qid=1748479888&sr=8-8) (anything up to 18mm wide should work)
- 6 x M3x12mm
- 1 x M3x6mm
- 2 x M3x25mm

---

## What’s Next?
Now that I’ve got reliable room-by-room presence detection, I’ll be using this data to *properly* automate my ducted air conditioning — a project that’s already showing massive potential in testing.

That’ll be the next video, so hit subscribe on [**The Stock Pot**](https://www.youtube.com/@TheStockPot-AU) if you haven’t already.  

And if you’ve got ideas for improving this design, I’d love to hear them. Hit me up in the comments or [drop me a message.](https://www.thestockpot.net/contact)

---

[[log/youtube/index]] 
