---
title: "Recipe Website Analysis - Streamlit Dashboard"
slug: recipe-website-analysis-streamlit-dashboard
date: 2026-03-15T16:34:35+13:00
lastmod: 2026-03-15T16:34:35+13:00
description: "Back in 2023, as a capstone to learning SQL, I scraped a recipe website and designed a PostgreSQL database to store and query data about that site."
feature_image: "/content/images/2026/03/the-doctors-kitchen-dashboard-screenshot-2.png"
ghost_id: 69b61f1363fc660001f460d9
---

{{< button url="#embedded-dashboard" text="Skip the post and jump straight to the dashboard" align="center" >}}

Back in 2023, as a capstone to learning SQL, I scraped a recipe website and designed a PostgreSQL database to store and query data about that site. It was a really great way to finish my SQL learning spring, particularly since it gave me practical experience about how SQL databases need to work in the wild. I would encourage anyone learning from videos or a book to give something like this a go. It was also my first experience with dashboarding, [Streamlit](https://streamlit.io/) was such a good way to get into it. I'm not sure what it's like now, but you should check it out.

The website I scraped was [The Doctor's Kitchen](https://www.thedoctorskitchen.com/), and at the time it was a pretty simple website. One of my goals with the project was to be able to search the recipes by ingredients to see how I could use what was in my pantry, but now the website has it's own search functionality. It's such a good search too, letting you filter not just by ingredients or keywords, but also filter out allergens, select common dietary requirements, or filter to a handful of other useful categories.

I briefly tried to refresh the database behind the dashboard, and rerun my scraper. The classical techniques of web scraping (e.g., using tools like [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/)) are pretty fragile, so the scraper had completely broken because of website changes. But nowadays after you view a few recipes on their website, the rest of them get locked behind requiring a log in. That's fair enough, given the masses of bots on the internet nowadays. This was only mean to be a simple refresh for my new site, so I ended up just migrating the database from its old host on neon.tech to my self-hosted server. The only other change I've made is putting the Streamlit dashboard into a Docker image to make self-hosting easier.

Anyways, here's the dashboard. It also has a dedicated page on this site [here](/the-doctors-kitchen-dashboard/).

{{< doctors-kitchen-dashboard id="embedded-dashboard" heading="The Doctors Kitchen Dashboard" >}}

{{< bookmark
  url="https://github.com/finn-okeeffe/the_doctors_kitchen_project"
  title="GitHub - finn-okeeffe/the_doctors_kitchen_project"
  description="Contribute to finn-okeeffe/the_doctors_kitchen_project development by creating an account on GitHub."
  icon="/content/images/icon/pinned-octocat-093da3e6fa40.svg"
  author="finn-okeeffe"
  publisher="GitHub"
  thumbnail="/content/images/thumbnail/the_doctors_kitchen_project.png"
>}}
