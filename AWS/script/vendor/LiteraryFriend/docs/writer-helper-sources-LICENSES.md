# Licenses and provenance

## This consolidation pass

The final runtime is a loss-preserving merge of the user's existing Writer Tools code plus independently implemented research-driven extensions. Research references do not imply bundled dependency code.

GitHub licenses confirmed during this pass:
- write-good — MIT
- retext-readability — MIT
- wink-nlp — MIT
- opentype.js — MIT
- The Conlanger's Suite — MIT
- Yasgheld/SoundChange — MIT
- RiTa — GPL-3.0 (**research reference only; its source is not bundled**)
- Lexurgy — GPL-3.0 (**research reference only; its source is not bundled**)
- Story Graph Library — GPL-3.0 (**research reference only; its source is not bundled**)
- fonteditor-core — MIT (**research reference only; no dependency copied**)

The project already carried lexical/reference-data notices. They are retained below verbatim from the strongest pre-merge package.

---

# License and Source Notices

## Embedded data: CMU Pronouncing Dictionary

The transformed pronunciation/rhyme/stress indexes in `writer-reference.js` originate from CMUdict. The installed distribution notice is reproduced below.

```text
Copyright (C) 1993-2015 Carnegie Mellon University. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
   The contents of this file are deemed to be source code.

2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in
   the documentation and/or other materials provided with the
   distribution.

This work was supported in part by funding from the Defense Advanced
Research Projects Agency, the Office of Naval Research and the National
Science Foundation of the United States of America, and by member
companies of the Carnegie Mellon Sphinx Speech Consortium. We acknowledge
the contributions of many volunteers to the expansion and improvement of
this dictionary.

THIS SOFTWARE IS PROVIDED BY CARNEGIE MELLON UNIVERSITY ``AS IS'' AND
ANY EXPRESSED OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL CARNEGIE MELLON UNIVERSITY
NOR ITS EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

```

## Embedded data: Hunspell en_US / SCOWL

The transformed spelling/orthographic indexes in `writer-reference.js` originate from the system-installed Hunspell en_US/SCOWL word data. The installed Debian distribution notice (including upstream component notices) is reproduced below.

```text
This package was debianized by David Coe <davidc@debian.org>
on Sun, 15 Jun 2003.

SCOWL (Spell Checker Oriented Word Lists) is a collection of 
English word lists maintained by Kevin Atkinson 
<kevina@users.sourceforge.net>

It was downloaded from:
http://prdownloads.sourceforge.net/wordlist/scowl-5.tar.gz

SF project page:
http://wordlist.sourceforge.net/

Copyright: (extracted from the SCOWL README file):

The collective work is Copyright 2000-2011 by Kevin Atkinson as well
as any of the copyrights mentioned below:

  Copyright 2000-2011 by Kevin Atkinson

  Permission to use, copy, modify, distribute and sell these word
  lists, the associated scripts, the output created from the scripts,
  and its documentation for any purpose is hereby granted without fee,
  provided that the above copyright notice appears in all copies and
  that both that copyright notice and this permission notice appear in
  supporting documentation. Kevin Atkinson makes no representations
  about the suitability of this array for any purpose. It is provided
  "as is" without express or implied warranty.

Alan Beale <biljir@pobox.com> also deserves special credit as he has,
in addition to providing the 12Dicts package and being a major
contributor to the ENABLE word list, given me an incredible amount of
feedback and created a number of special lists (those found in the
Supplement) in order to help improve the overall quality of SCOWL.

The 10 level includes the 1000 most common English words (according to
the Moby (TM) Words II [MWords] package), a subset of the 1000 most
common words on the Internet (again, according to Moby Words II), and
frequently class 16 from Brian Kelk's "UK English Wordlist
with Frequency Classification".

The MWords package was explicitly placed in the public domain:

    The Moby lexicon project is complete and has
    been place into the public domain. Use, sell,
    rework, excerpt and use in any way on any platform.

    Placing this material on internal or public servers is
    also encouraged. The compiler is not aware of any
    export restrictions so freely distribute world-wide.

    You can verify the public domain status by contacting

    Grady Ward
    3449 Martha Ct.
    Arcata, CA  95521-4884

    grady@netcom.com
    grady@northcoast.com

The "UK English Wordlist With Frequency Classification" is also in the
Public Domain:

  Date: Sat, 08 Jul 2000 20:27:21 +0100
  From: Brian Kelk <Brian.Kelk@cl.cam.ac.uk>

  > I was wondering what the copyright status of your "UK English
  > Wordlist With Frequency Classification" word list as it seems to
  > be lacking any copyright notice.

  There were many many sources in total, but any text marked
  "copyright" was avoided. Locally-written documentation was one
  source. An earlier version of the list resided in a filespace called
  PUBLIC on the University mainframe, because it was considered public
  domain.

  Date: Tue, 11 Jul 2000 19:31:34 +0100

  > So are you saying your word list is also in the public domain?

  That is the intention.

The 20 level includes frequency classes 7-15 from Brian's word list.

The 35 level includes frequency classes 2-6 and words appearing in at
least 11 of 12 dictionaries as indicated in the 12Dicts package.  All
words from the 12Dicts package have had likely inflections added via
my inflection database.

The 12Dicts package and Supplement is in the Public Domain.

The WordNet database, which was used in the creation of the
Inflections database, is under the following copyright:

  This software and database is being provided to you, the LICENSEE,
  by Princeton University under the following license.  By obtaining,
  using and/or copying this software and database, you agree that you
  have read, understood, and will comply with these terms and
  conditions.:

  Permission to use, copy, modify and distribute this software and
  database and its documentation for any purpose and without fee or
  royalty is hereby granted, provided that you agree to comply with
  the following copyright notice and statements, including the
  disclaimer, and that the same appear on ALL copies of the software,
  database and documentation, including modifications that you make
  for internal use or for distribution.

  WordNet 1.6 Copyright 1997 by Princeton University.  All rights
  reserved.

  THIS SOFTWARE AND DATABASE IS PROVIDED "AS IS" AND PRINCETON
  UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR
  IMPLIED.  BY WAY OF EXAMPLE, BUT NOT LIMITATION, PRINCETON
  UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES OF MERCHANT-
  ABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE
  LICENSED SOFTWARE, DATABASE OR DOCUMENTATION WILL NOT INFRINGE ANY
  THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER RIGHTS.

  The name of Princeton University or Princeton may not be used in
  advertising or publicity pertaining to distribution of the software
  and/or database.  Title to copyright in this software, database and
  any associated documentation shall at all times remain with
  Princeton University and LICENSEE agrees to preserve same.

The 40 level includes words from Alan's 3esl list found in version 4.0
of his 12dicts package.  Like his other stuff the 3esl list is also in the
public domain.

The 50 level includes Brian's frequency class 1, words words appearing
in at least 5 of 12 of the dictionaries as indicated in the 12Dicts
package, and uppercase words in at least 4 of the previous 12
dictionaries.  A decent number of proper names is also included: The
top 1000 male, female, and Last names from the 1990 Census report; a
list of names sent to me by Alan Beale; and a few names that I added
myself.  Finally a small list of abbreviations not commonly found in
other word lists is included.

The name files form the Census report is a government document which I
don't think can be copyrighted.

The file special-jargon.50 uses common.lst and word.lst from the
"Unofficial Jargon File Word Lists" which is derived from "The Jargon
File".  All of which is in the Public Domain.  This file also contain
a few extra UNIX terms which are found in the file "unix-terms" in the
special/ directory.

The 55 level includes words from Alan's 2of4brif list found in version
4.0 of his 12dicts package.  Like his other stuff the 2of4brif is also
in the public domain.

The 60 level includes all words appearing in at least 2 of the 12
dictionaries as indicated by the 12Dicts package.

The 70 level includes Brian's frequency class 0 and the 74,550 common
dictionary words from the MWords package.  The common dictionary words,
like those from the 12Dicts package, have had all likely inflections
added.  The 70 level also included the 5desk list from version 4.0 of
the 12Dics package which is the public domain.

The 80 level includes the ENABLE word list, all the lists in the
ENABLE supplement package (except for ABLE), the "UK Advanced Cryptics
Dictionary" (UKACD), the list of signature words in from YAWL package,
and the 10,196 places list from the MWords package.

The ENABLE package, mainted by M\Cooper <thegrendel@theriver.com>,
is in the Public Domain:

  The ENABLE master word list, WORD.LST, is herewith formally released
  into the Public Domain. Anyone is free to use it or distribute it in
  any manner they see fit. No fee or registration is required for its
  use nor are "contributions" solicited (if you feel you absolutely
  must contribute something for your own peace of mind, the authors of
  the ENABLE list ask that you make a donation on their behalf to your
  favorite charity). This word list is our gift to the Scrabble
  community, as an alternate to "official" word lists. Game designers
  may feel free to incorporate the WORD.LST into their games. Please
  mention the source and credit us as originators of the list. Note
  that if you, as a game designer, use the WORD.LST in your product,
  you may still copyright and protect your product, but you may *not*
  legally copyright or in any way restrict redistribution of the
  WORD.LST portion of your product. This *may* under law restrict your
  rights to restrict your users' rights, but that is only fair.

UKACD, by J Ross Beresford <ross@bryson.demon.co.uk>, is under the
following copyright:

  Copyright (c) J Ross Beresford 1993-1999. All Rights Reserved.

  The following restriction is placed on the use of this publication:
  if The UK Advanced Cryptics Dictionary is used in a software package
  or redistributed in any form, the copyright notice must be
  prominently displayed and the text of this document must be included
  verbatim.

  There are no other restrictions: I would like to see the list
  distributed as widely as possible.

The 95 level includes the 354,984 single words, 256,772 compound
words, 4,946 female names and the 3,897 male names, and 21,986 names
from the MWords package, ABLE.LST from the ENABLE Supplement, and some
additional words found in my part-of-speech database that were not
found anywhere else.

Accent information was taken from UKACD.

My VARCON package was used to create the American, British, and
Canadian word list. 

Since the original word lists used used in the VARCON package came
from the Ispell distribution they are under the Ispell copyright:

  Copyright 1993, Geoff Kuenning, Granada Hills, CA
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions
  are met:

  1. Redistributions of source code must retain the above copyright
     notice, this list of conditions and the following disclaimer.
  2. Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in the
     documentation and/or other materials provided with the distribution.
  3. All modifications to the source code must be clearly marked as
     such.  Binary redistributions based on modified source code
     must be clearly marked as modified versions in the documentation
     and/or other materials provided with the distribution.
  (clause 4 removed with permission from Geoff Kuenning)
  5. The name of Geoff Kuenning may not be used to endorse or promote
     products derived from this software without specific prior
     written permission.

  THIS SOFTWARE IS PROVIDED BY GEOFF KUENNING AND CONTRIBUTORS ``AS
  IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
  FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL GEOFF
  KUENNING OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
  ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
  POSSIBILITY OF SUCH DAMAGE.

```

## Research-only projects (no bulk source copied)

- write-good — MIT — https://github.com/btford/write-good
- retext-readability — MIT — https://github.com/retextjs/retext-readability
- compromise — MIT — https://github.com/spencermountain/compromise
- wink-nlp — MIT — https://github.com/winkjs/wink-nlp
- ink / inkjs — MIT — https://github.com/inkle/ink and https://github.com/y-lohse/inkjs
- Tonal — JavaScript music-theory research — https://github.com/tonaljs/tonal
- abcjs — MIT — https://github.com/paulrosen/abcjs

The implementations added by this pass are original integrations based on general techniques and documented APIs/algorithms, rather than copied third-party source.


## Language-evolution research additions

No third-party repository source code is vendored by this pass. The sound-change, phonology, script-evolution, TTF, and export implementations are original Writer Tools code informed by published specifications and research. GitHub projects used for architectural research are documented in `README.md` (Language Evolution Research & Implementation Sources), including MIT-licensed opentype.js and Yasgheld, MIT-Modern-Variant PanPhon, CLTS/PHOIBLE data architecture, and GPL Lexurgy as research-only inspiration with no copied/adapted source.

The large embedded language/phonology/script atlases are original generated scenario data. No PHOIBLE, CLTS, Glottolog, Unicode database dump, or copyrighted article text is embedded in those atlases.

## Expansion Pass II — research/license ledger (2026-09-21)

No source code or raw datasets from the repositories below are bundled by this pass. They were consulted for algorithms, API/architecture patterns, terminology, or domain coverage; Writer Tools implementations and the newly embedded research-card atlases are original. The licenses below are recorded so future maintainers can distinguish “research reference” from “vendored dependency.”

- opentypejs/opentype.js — MIT — https://github.com/opentypejs/opentype.js
- alray2569/SoundChange (Yasgheld) — MIT — https://github.com/alray2569/SoundChange
- def-gthill/lexurgy — GPL-3.0 — **research only; no GPL source copied/adapted** — https://github.com/def-gthill/lexurgy
- grambank/grambank — CC-BY-4.0 dataset — **no Grambank rows copied** — https://github.com/grambank/grambank
- WALS CLDF — dataset reference — **no WALS rows copied** — https://github.com/cldf-datasets/wals
- PHOIBLE CLDF — dataset reference — **no PHOIBLE rows copied** — https://github.com/cldf-datasets/phoible
- CLTS — transcription/sound architecture reference — **no CLTS dataset copied** — https://github.com/cldf-clts/clts
- PanPhon — feature-system research reference — **no Python source/data copied** — https://github.com/dmort27/panphon
- inkjs — MIT — https://github.com/y-lohse/inkjs
- Kindling — MIT — https://github.com/smith-and-web/kindling
- Fountain.js — MIT — https://github.com/mattdaly/Fountain.js
- Tonal — MIT — https://github.com/tonaljs/tonal
- Scribbletune — MIT — https://github.com/scribbletune/scribbletune
- Magenta.js — Apache-2.0 — https://github.com/magenta/magenta-js
- write-good — MIT — https://github.com/btford/write-good
- retext-readability — MIT — https://github.com/retextjs/retext-readability
- alex — MIT — https://github.com/get-alex/alex
- CanonKit — architecture/continuity research only; no source copied and no license-dependent reuse is claimed — https://github.com/sadasdfsaf/canonkit

Public/scholarly research references (facts/terminology only; article text is not embedded): Metropolitan Museum of Art alphabet-history material, Unicode Standard Chapter 7, UNESCO *Language Vitality and Endangerment*, and Oxford Handbook material on loanword adaptation. Full URLs are recorded in `docs/README.md`.

The expansion’s **80,000 language cards** and **40,000 craft cards** are original generated scenario/authoring data. They do not reproduce WALS, Grambank, PHOIBLE, CLTS, books, articles, GitHub README prose, or third-party source code.


## William Saville user-authored corpus integration (2026-09-22)

The `william-saville_stories.js`, `william-saville_poetry.js`, and `william-saville_lyrics.js` corpus material was supplied by the user for this project and is treated as project-author content, not third-party research material. The integration pass does not relicense that writing or assert rights beyond its use inside this requested package.

`writer-william-voice.js` and `writer-fallback-brain.js` are project integration code created for this package. Existing third-party research references and their license notes remain as documented above; this pass does not vendor new third-party source code.

## Final deep-research pass — additional reference ledger

These were used as research/architecture references; no repository source is bulk-vendored by this final pass:

- Unicode Standard / Egyptian Hieroglyphs and writing-system chapters — specification/history reference.
- Unicode UAX #57 / Unikemet — Egyptian-hieroglyph metadata architecture reference.
- PHOIBLE 2.0 — cross-linguistic phoneme-inventory/feature research; no PHOIBLE rows are embedded by this final pass.
- WALS — typological grammar research; no WALS rows are copied.
- UNESCO Language Vitality and Endangerment — multi-factor vitality framework reference.
- Lexurgy — GPL-3.0 sound-change software; research only, no GPL source copied/adapted.
- RiTa — GPL-3.0 computational-writing library; research only, no GPL source copied/adapted.
- fonteditor-core — MIT browser font read/write architecture reference; no source copied.
- retext / retext-readability — MIT text-processing/readability architecture references.
- write-good — MIT prose-linting architecture reference.
- wink-nlp — MIT browser NLP architecture reference.
- inkjs — branching narrative runtime reference.
- opentype.js — MIT browser font-construction reference.
- The Conlanger’s Suite and Yasgheld — MIT conlang/sound-change architecture references.

User-authored lyric/story/poetry samples retrieved from the linked Google Drive folder were used only as authorized style evidence for this user-specific project. They are not third-party research assets and are not relicensed here.
