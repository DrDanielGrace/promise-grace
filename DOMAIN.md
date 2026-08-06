# Moving the site to a domain

What to do when the domain arrives. Nothing here has been done yet, no DNS
has been touched, and nothing has been bought.

The site currently lives at:

    https://drdanielgrace.github.io/promise-grace/

The `/promise-grace/` on the end is there because it is a project site rather
than a user site. A custom domain removes it, so the same pages end up at the
root of the new address.

---

## Before you start, the thing that usually breaks this

Every path in this site is **relative**. Nothing begins with a slash. That was
deliberate and it is what makes the move painless, because a path starting
with `/` means "the root of the domain", which is a different place before and
after the switch.

Checked at the time of writing, across every HTML, CSS and JavaScript file:

- no `src="/..."`, `href="/..."`, `srcset="/..."` or `content="/..."`
- no `url(/...)` in any stylesheet
- no hardcoded `drdanielgrace.github.io` anywhere

If you ever add a path that begins with a slash, it will work on the domain
and break on the github.io address, or the reverse. Keep them relative.

---

## Step 1 · Buy the domain

Any registrar. Namecheap, Cloudflare, Porkbun, Gandi are all fine. You want
the plain domain, not their hosting, not their website builder, not their
email. Just the name.

Write down which registrar you used. You will need to log back into it in
step 3.

---

## Step 2 · Tell GitHub about it

1. Go to **https://github.com/DrDanielGrace/promise-grace**
2. Click **Settings** in the repo's top bar, not your account settings
3. Left sidebar, under **Code and automation**, click **Pages**
4. Find **Custom domain**, type the domain in, click **Save**

GitHub writes a file called `CNAME` into the repo containing just the domain.
That file is how it remembers. Do not delete it and do not edit it by hand.

The page will say the DNS check is in progress and probably show a warning.
That is expected until step 3 is finished and has propagated.

---

## Step 3 · Point the DNS at GitHub

Back at the registrar, find the DNS settings. What you add depends on whether
you want the domain with or without `www`.

### For an apex domain, meaning `example.com` with no www

Add four **A** records, all with the name `@` (some registrars call this
blank, or the domain itself):

    185.199.108.153
    185.199.109.153
    185.199.110.153
    185.199.111.153

Those are GitHub's Pages servers. All four, not one.

If your registrar supports **ALIAS** or **ANAME** records, a single one
pointing at `drdanielgrace.github.io` is better than the four A records,
because it survives GitHub changing those addresses. Cloudflare, Gandi and
Porkbun all support this. Namecheap does not.

### For a www domain, meaning `www.example.com`

Add one **CNAME** record:

    name:   www
    value:  drdanielgrace.github.io

Note the trailing part is the github.io address, not the full URL and not the
project path.

### Doing both

Most people want both, so that either address works. Add the four A records
for the apex **and** the www CNAME, then set the custom domain in GitHub to
whichever one you want to be the real address. GitHub redirects the other.

---

## Step 4 · Wait

DNS changes take anywhere from a few minutes to a few hours. Occasionally
longer. There is nothing to do during this except wait, and refreshing the
GitHub Pages settings page will not speed it up.

You can check progress from a terminal:

```bash
nslookup example.com
```

When it comes back with the GitHub addresses rather than your registrar's
parking page, it has propagated.

---

## Step 5 · Turn HTTPS on

This is a separate switch and it is easy to miss.

1. Repo **Settings**, then **Pages** again
2. Tick **Enforce HTTPS**

The tickbox stays greyed out until GitHub has issued a certificate for the
domain, which happens automatically once DNS resolves. If it is still greyed
out after a few hours with DNS resolving correctly, remove the custom domain,
save, add it again, and save. That re-triggers the certificate request and it
usually clears it.

Do not skip this. Without it the site is served over plain HTTP, browsers
will flag it, and a professor clicking a link from a cold email will see a
warning before they see anything Promise wrote.

---

## Step 6 · Check it afterwards

In a browser, on the new domain:

- The cover loads and the research question is there
- Scroll to Entry 01 and the three simulations run: nucleation, then crystal
  growth, then diffraction
- Open a notebook scan and check the image appears rather than alt text
- Click **Download CV** and confirm the file saves as
  `Promise Grace Research CV.pdf`
- Follow the link to the mission planner and the link back
- The address bar shows a padlock

From a terminal, the same checks without the clicking:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/assets/promise-grace-research-cv.pdf
curl -s -o /dev/null -w "%{http_code}\n" https://example.com/sim.js
```

All three should be `200`.

---

## Step 7 · The things that are now wrong elsewhere

The domain changes some text that lives outside this repo. None of it is
urgent, but it is easy to forget:

- The link in Promise's email signature
- Any cold emails already sent still point at the github.io address. That
  keeps working, because GitHub redirects it, so there is nothing to fix
- Her CV, if it carries the site address
- ORCID, if the site is listed there
- The `og:image` meta tag is a relative path and needs no change

---

## If something goes wrong

**The site 404s on the new domain.** DNS has resolved but GitHub has not
matched it to the repo. Check the `CNAME` file in the repo contains exactly
the domain, no `https://`, no trailing slash.

**The site loads but the styling is missing.** Something has an absolute
path. Search the repo for `="/` and make it relative.

**HTTPS will not enable.** Covered in step 5. Remove the custom domain, save,
add it back, save.

**The old address stopped working.** It should not. GitHub redirects the
github.io URL to the custom domain permanently. If it genuinely stopped,
check the repo is still public.

---

## One deployment note

This repo builds through GitHub Actions rather than the legacy Pages builder,
using `.github/workflows/pages.yml`. That was a deliberate change: the legacy
builder failed seven consecutive times on this repo, hanging and being
cancelled at about fifteen minutes each, on commits that served correctly from
a local server.

If a push ever appears not to deploy, check the **Actions** tab for the
**Deploy to Pages** run rather than assuming it is queued. It can also be run
by hand:

```bash
gh workflow run pages.yml --repo DrDanielGrace/promise-grace --ref main
```

Moving to a custom domain does not change any of that.
