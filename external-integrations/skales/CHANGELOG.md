# **Changelog**

All notable changes to Skales will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v12.5.4 - Pictures and Providers

Sending a picture is a normal chat turn now. It was not: it ran on a path of its own, outside everything the app does to keep an answer alive, and the previous release patched that path instead of removing it. The path is gone, and the same class of loss is fixed everywhere else it hid - in Buddy, in the AI Pointer overlay, and in the model recognition that quietly shrank a new model's context window to an eighth of its real size. Moving that turn onto the normal path also broke a promise nobody could see from the outside: an incognito chat with a picture in it was being written to disk. An incognito chat now runs on a conversation that has no file at all. Moonshot AI (Kimi) joins as a provider.

### Fixed

- **Incognito keeps its promise on picture turns.** Since image turns became normal chat turns, the answer to a picture was written to the chat file by the part of the app that generates it - which never knew about incognito. An incognito chat with a picture in it was saved, and saved half-blind: your own message suppressed, the reply kept. An incognito chat now runs on a conversation that exists only in memory: nothing about it is written anywhere, not the messages, not the live reply, not an entry in History, and it is gone when you leave incognito or close the app.
- **The app's own nudges stop being mistaken for your instructions.** When a turn needs a correction, the app writes one into the conversation the same way you would, because that is the only way it reaches the model. Everything that then looked back for "what did the user ask?" found the correction instead: a parked task could adopt a nudge as its objective, and it could be written into memory as something you had said. A checklist created during such a turn also went invisible, so a task that had a plan stopped continuing on its own. The corrections still reach the model, unchanged; they are no longer read back as yours.
- **Stop reaches an image turn during the handoff too.** Stopping while the picture was being prepared cleared the screen, and the turn then started anyway a moment later: the answer arrived after you had stopped it. It now ends the run it just started.
- **Buddy still sees the screenshot after you approve an action.** Approving a tool continues the same turn in a second request, and that continuation went back to the stored conversation - where the picture is a placeholder by design. The stored picture is read back for the continuation, so the rest of the turn is answered about the screenshot too.
- **A picture no longer pushes the conversation out of the request.** An attached screenshot was sent at full resolution - several megabytes - and the app measured that literally when deciding how much history still fit, so one picture could take the entire budget and the model answered it with no conversation behind it at all. Pictures are now sent at the size every provider scales them to anyway (the stored copy stays full resolution), and they are counted for what they cost instead of by their raw size. Long chats with images also got noticeably faster.
- **Moonshot's region switch works everywhere it should.** Refreshing the model list ignored the picked region and asked the international host with a China key (two separate accounts - the key is invalid there), so Refresh reported no models on a correctly set up provider. The selected region also did not look selected, because it was painted with colours that only exist in the AI Pointer window. Both fixed, and a stored address in a slightly different but equivalent form is now recognised as its region.
- **Buddy sees the screenshot you attach.** Attaching a picture in Buddy showed it in Buddy's own bubble and then answered past it, because the image never reached the model. Session files deliberately do not store raw image data, and Buddy read its history back from that stored copy - so what arrived at the model was the placeholder the storage layer had left behind. Opening the chat afterwards showed that same placeholder as a broken image. The picture is now stored as a file the chat can render, and the live one is handed to Buddy directly, routed to a model that can actually see.
- **Pictures from Buddy and the AI Pointer show up in the chat.** Those turns store the picture as a file and no preview copy, and the chat bubble only ever looked for the preview - so opening the chat afterwards showed the message with no image at all. The stored picture is now shown directly.
- **A screenshot sent from the AI Pointer overlay to the chat keeps its picture.** The overlay sent the image along with the question, and the chat import ignored it, so the turn arrived as text with the picture missing.
- **New model generations work the day they land.** Model recognition was written as per-version lists, so each one broke the moment a vendor shipped the next number. A Gemini generation newer than the app ran through OpenRouter at an eighth of its context window and an eighth of its output limit, which made long chats compact themselves far too early and cut long answers short. Kimi's vision-capable generations were a literal two-entry list that the next release would not have matched. Both are rules now: a new Gemini or Kimi generation is sized and detected correctly without waiting for a Skales update.
- **Extra custom endpoints get their real context window.** Every endpoint added under Additional Custom Providers fell back to the smallest possible window rather than the one custom endpoints are meant to get, so a 128K model was run at half of it and conversations started compacting after a handful of turns. The single built-in custom slot was never affected.
- **The switches on a custom endpoint do something.** On endpoints added under Additional Custom Providers, turning tool calling off did nothing - the tools were sent anyway, and an endpoint that cannot call them answered with garbage. The Vision checkbox was worse: nothing in the app ever read it, on any custom endpoint, so images were stripped out before the request left regardless of what you ticked. Both are honoured now, and both still default to what they did before.
- **An image turn no longer reports itself dead while it is working.** The composer watches for a locked input with no live turn behind it and frees it after 25 seconds. An image turn never registered as a live turn, so on every picture you sent - since the release that added that guard - the app unlocked the composer and said the run had stopped responding, while your Vision Provider was in fact still reading. Reading one image with a local model takes longer than that on its own, several images take minutes. Image turns are real turns now, and the guard leaves them alone.
- **You can watch an image answer arrive.** The reply now streams token by token like any other, instead of showing a spinner until the whole answer is finished. On a long answer from a local model that is the difference between a working turn and a turn that looks frozen.
- **Stop stops an image turn.** The button could not reach the call that was running; it cleared the screen while the work continued in the background and the answer landed afterwards anyway. It now ends the actual turn.
- **Your custom agent answers your images.** With an agent selected, an image turn used its model but not its instructions, so the picture was answered by the default assistant wearing the agent's name. The agent's own prompt and its assigned skills now apply to an image turn. A picture handed straight to the chat model is still answered without tools, so that the model reads the image instead of reaching for something else; with a Vision Provider set up, the turn keeps the full toolset.
- **A reply cut off mid-sentence finishes itself.** When a model hit its output limit, the answer simply stopped where it stopped. The rest is now requested and joined onto what came before, so one complete message lands. This applies to every chat turn, and to the ones nobody is watching: a task, a Flow run or a scheduled run used to accept a half sentence as its finished result and close on it.
- **A picture that could not be answered says so, permanently.** If starting the answer failed outright, the error showed once and was gone: after a reload the picture sat there with no reply at all, and the model later saw a conversation ending on an unanswered question. The failure is now part of the conversation. The helpful guides for the two most common causes - the Ollama vision model is not installed, or the Vision Provider has no key - are also back, in all twelve languages; they had been lost in the rebuild and every cause showed the same generic text.
- **Telegram and WhatsApp answers carry the same protection as the desktop chat.** The way those two channels handed their instructions to the model switched off the assembly step that, among other things, tells the model to treat fetched web pages, files and messages as data rather than as instructions. Both channels now go through the same assembly as everything else, and material coming back from tools is marked as untrusted content there too.
- **A reply cut off mid-sentence finishes itself on every channel.** The repair that stitches a truncated answer back together existed only in the desktop chat. On Telegram and WhatsApp a long reply simply ended mid-sentence; from the phone it was worse - the beginning of the answer was dropped and the message started mid-sentence. Buddy never checked at all. All four now request the missing remainder and deliver one complete message.
- **A model that thinks itself empty gets rescued on every channel.** When reasoning consumes the entire reply budget, the desktop chat raises the budget, then turns reasoning off, then says honestly what happened. Telegram, WhatsApp, Buddy and the phone either retried the identical doomed request or invented a cause: Buddy said a bare "No response.", the phone blamed your provider settings. All of them now climb the same ladder and, if it truly ends empty, tell you what actually happened - in your language.
- **A tool call torn by the reply limit no longer runs broken on Telegram and WhatsApp.** A file write cut off mid-content executed anyway with half its content or failed on unreadable arguments. Like the desktop chat, both channels now hold the torn call back and ask the model to redo it in smaller pieces.
- **A picture sent from the phone reaches a model that can see.** An image turn from the phone ran on whatever model was active; if that model cannot process images they were quietly removed before the request went out, and the answer ignored the picture. The turn is now routed the same way a desktop image turn is: to a model that can actually look at it.
- **The recovery steps a stuck turn is supposed to take now actually happen.** When a model spends its whole budget on internal reasoning, repeats a failing tool call, or announces a step and then does nothing, the app sends it a correction and tries again. Those corrections were being dropped before they left the app, so the retry re-sent the identical request and the model repeated itself. They reach the model now. Instructions from your own hooks were dropped the same way and now arrive too.
- **An incognito chat stays incognito, and stops being lost.** Leaving the chat page and coming back reopened the incognito conversation as an ordinary chat: no purple marking, no "nothing is saved" notice, and because it kept running on a conversation that has no file, everything written in it from then on was saved nowhere and gone at the next start. Coming back to an off-record chat now finds it marked as one.
- **The picture in an incognito chat is not written to disk either.** Attaching an image saved the full-resolution original into the workspace uploads folder before the chat even existed, and nothing removed it afterwards, so it stayed readable by every file tool long after the conversation was gone. Off the record now covers the picture too.
- **The Buddy carries the same protection as everything else.** The way the Buddy handed its instructions to the model switched off the step that tells the model to treat fetched pages, files and messages as data rather than as instructions, and its tool results were not marked as untrusted. It is the assistant with the widest reach and the one that runs a step without asking, so it needed that protection most. It now goes through the same assembly as the desktop chat and the two messaging channels.
- **A cut-off answer no longer disappears when finishing it fails.** A reply that hit the output limit is continued and joined into one message, but if that second request failed or you pressed Stop while it was running, the half you had already watched arrive was thrown away and only an error remained. What was produced is kept now, whichever way the turn ends.
- **A picture is no longer sent to a model that cannot see it.** On providers where the app cannot swap in a seeing model by itself, an image turn from your phone or from the Buddy went out to whatever model was active, and a text-only model answered with the provider's raw rejection. The turn now says plainly that the model cannot read images, and how to set up one that can.
- **Kimi's own default model reads pictures again.** Recognition was written around version numbers, and the rolling model name Skales itself ships as the Moonshot default carries no version number, so the app treated its own default as unable to see: through OpenRouter it quietly moved the picture to a different vendor's model, and on Moonshot it reported the model as blind. That name and the 2.5 generation are recognised now.
- **Gemini's image models get their real context window.** They were sized by the family rule at a million tokens, thirty times their actual window, so the conversation was never compacted, the context meter read far too low, and the request failed once the chat passed the real limit. They now carry their own sizes, and a picture-model released later is sized cautiously instead of far too large.
- **"Test connection" honours the Moonshot region.** The button always tested against the international host, so a correctly set up China account reported an invalid key, and a passing test saved a configuration still pointing at the other service. The region you picked is now used for the test and stored with it.

### Added

- **Moonshot AI (Kimi) is a provider you can just pick.** Paste a key, choose International or China, and it works the way every other provider works: in chat, in Lio AI, in Codework, in Flow, in group chats, in custom skills, in the onboarding, and in the model picker everywhere models are chosen. The two Moonshot services are separate accounts with separate keys, so the region is a switch rather than something to type. Kimi's context window, its tool-call handling and its tuning profile were already in the app; what was missing was the provider itself.

## v12.5.3 - Flow Hotfix

The 12.5.2 reasoning watchdog cut healthy long-thinking runs: models that built a motion graphic fine one day earlier spent half an hour in cut-and-retry ladders the next. The guard is now behavioural, the stall card actually does what it offers, custom widgets are usable again in every theme, and custom agents see your connected MCP servers again.

### Fixed

- **A custom agent sees your MCP servers again.** The chat agents you build yourself run on their own prompt, which left out everything about the environment they work in: the connected MCP servers were never mentioned to them, and the tools were waiting behind a load step the agent was never told about. Asked about a connected server, such an agent answered that none were set up. Custom agents now get the same truthful MCP status as the default assistant - which servers are connected, and the exact step to pull their tools in - plus the index of every other tool group they can load.
- **An image with text gets a real answer.** Sending a picture along with a question could end in a silently empty reply: a reasoning model that spent the whole turn thinking produced no visible text, and the image turn had none of the safeguards normal chat turns have, so nothing appeared and no error was shown. In older versions the same gap showed up as a reply cut off mid-sentence. An image turn now retries once asking for the answer directly, stitches a cut-off reply back together with one continuation, and when a model truly never answers it says so honestly instead of staying silent.
- **New vision models are recognized without waiting for an update.** Skales asks your Ollama daemon what each model can actually do instead of matching names against a built-in list, so a model that just came out is treated as vision-capable the moment it appears. Kimi K2.6 and K2.7 stop being flagged as text-only, and the name list stays only as a fallback for older daemons.
- **The image-description row fits its content.** The collapsed "Vision" row under an attached image stretched across the full bubble width, which next to a narrow image looked like a broken layout. It now hugs its label and only widens when opened.
- **Custom widgets scroll again.** A widget taller than the window could not be scrolled at all: it grew past its pane while the pane itself refused to scroll, so everything below the fold was simply unreachable. Clicking or typing also made the page slide down under the pointer, because the widget's own click handling was being mistaken for new content.
- **Custom widgets follow your theme.** They were painted in fixed dark colours, so on a light theme the text was unreadable. They now inherit the theme's own colours and switch along with it, without losing what you had entered.

- **Long-thinking models can think again.** The previous release stopped a reasoning stream once it crossed a fixed share of the reply budget, which killed exactly the deep runs it was meant to protect, and then retried the doomed step with the very same budget. The stream is now stopped only when the model is provably stuck repeating its own trace, or exceeds the physical context window; whether a budget is exhausted stays the provider's call. The pointless same-budget retry is gone, and the request no longer asks for a reasoning bound the failing models were measured to ignore.
- **The stall card's buttons work.** "Keep going" was re-raised by the next status poll within a second, and Stop had to win a race against that same poll, which could take a dozen clicks. Dismissing the card now sticks for the rest of the run, and Stop takes effect immediately while the server abort settles in the background.

- **Motion scenes no longer bleed through each other.** Scene transitions layer the incoming scene over the outgoing one, and a transparent scene showed both at once (old text under new text). Scenes are opaque by default now, and Flow renders frames from inside the transitions after every motion turn and checks them - plus a code-level check for exactly this class of conflict - firing a correction automatically when something is off.
- **Your model choice in Flow is the one that runs.** If a model was set under Settings > Chat & Code > Code model, it silently overrode the model picked in Flow: the project kept showing your choice while the run used another model, and switching models to escape a stalled run changed nothing. Flow's own pick now wins in Flow.
- **Options that promised something they did not do.** The reasoning-effort dial is hidden on models that have no such control instead of being offered and ignored. Switching mode clears a pinned image or video provider that does not exist in the new mode. A pinned skill that you switch off in settings stops riding along. Pinned-skill and style-pack chips show real names instead of raw slugs.
- **A short motion brief stays short.** Asking for 3 or 5 seconds used to arrive at the model alongside two other duration ranges from the built-in guidance, and the model spent the turn reconciling them. Your duration now overrides everything else and shapes the scene plan.
- **Image and video projects see your attachments.** Those modes skipped part of the briefing: an attached reference image was never mentioned to the model, and they had neither the fact-checking rules nor the scratchpad the other modes get.
- **Flow's option rows scroll instead of wrapping.** The mode chips, the composer options and the project toolbar stay on one line and slide sideways at every window size. Dropdown menus can no longer leave the window: they clamp to the frame, flip upward when there is no room below, and the reasoning-effort row in the model menus is always visible instead of hiding behind the model list's scroll.

### Added

- **Changing the model mid-run resumes the work.** Picking a different model while a run is working closes that run, moves the project to the new model and continues the work in place, without restating the brief. This is what the stall card's "Change model" now does, and the project's model menu behaves the same way.
- **PDF export for decks and documents.** Both modes have advertised it since Flow shipped without an actual export anywhere in the app. The preview bar now has it: a deck exports one full-bleed landscape page per slide, a document exports through its own print layout.
- **A scratchpad in every Flow project.** The agent keeps a small working-memory file - plan, decisions, open items - current while it works, and a panel in the project shows it live. It carries over into new chapters, so long projects keep their thread.

## v12.5.2 - Flow and Security

Flow gets real controls for long projects and long-thinking models, a security hole on the local command interface is closed, and the app finally reports its own version correctly.

### Fixed

- **A closed door that was standing open.** The local command interface accepted requests without a valid access token, so anything on the same network could reach it. It now requires the token, the way it always should have.
- **Reasoning models that thought forever now get stopped.** Some models spend their entire reply budget on internal reasoning and never write an answer. A live watchdog now ends a run that has clearly thought past its whole budget, instead of leaving you staring at a spinner for twenty minutes.
- **Flow's Stop button actually stops.** After a page reload it used to lose track of the run and only pretend to stop while the work kept going. Stop now reaches the real run every time, and reopening a project reconnects to it.
- **A crashing preview no longer takes the whole project down.** A render error is caught in place and recovers, instead of blanking the page and orphaning the run.
- **The app reports the right version.** System properties and the About box were frozen at an old number regardless of the installed release; they now match.
- **DevKit can be enabled on an installed app.** The developer command interface only worked from a source checkout; it now reads its config from the data directory (`~/.skales-data/devkit/`), so the CLI works on a normal install. Requires the matching DevKit CLI v0.3.0.

### Added

- **New chapter in Flow.** After many rounds of changes a project can continue in a fresh, lighter session that keeps the files and a short summary but drops the long transcript, so it stays fast and costs less. Offered on its own once a project gets heavy; your brand kit, template and model choices come along.
- **Change the model and reasoning effort mid-project.** Both were only settable when starting a project; now they sit in the project's model menu and apply from the next step.
- **A way out when a model stalls.** If a model finishes twice with nothing but reasoning and no answer, the panel offers to switch to a different model instead of leaving you stuck.
- **Option chips scroll on narrow screens.** The mode and parameter rows slide sideways instead of stacking into several lines.

## v12.5.1 - Hotfix

Connected MCP servers are visible to the AI again, background tasks stop running in circles, slow models get the time they need, and the Tasks page becomes something you can actually keep tidy.

### Fixed

- **The AI can see your connected MCP servers again.** Their tools are fetched on demand to keep messages lean, but the AI was being told they were already active, so it concluded it could only see the built-in tools. It now knows how to pull in each server's tools and does so on its own in chat, Flow and scheduled runs.
- **Slow models no longer lose a whole task partway through.** A single model reply was cut off after a fixed short limit, and because that counts as an error the task failed with no resume - painful for local and reasoning models that legitimately take longer to answer. The reply now has the full task time to finish.
- **Background and scheduled tasks now see the full results of their file reads and searches.** Until now they received only a bare count or metadata, so a task that needed to look something up could repeat the same search endlessly, burning through its time limit run after run without ever finishing. The same blind spot affected agent teams and the Buddy after a tool approval. All of them now see exactly what chat sees.
- **Deleting an old reminder on the Tasks page works now.** Rows that came from the Planner were silently ignored by the delete button, so one-time reminders could never be removed from the list.
- **Flow shows what the model is actually doing.** A reasoning model can think for minutes before the first visible word, and Flow showed only a bare "deciding" spinner the whole time. The status row now shows that the model is reasoning, a live glimpse of its train of thought, and the elapsed time. The Stop button remains available throughout.
- **An answer no longer comes back empty after a long reasoning phase.** Models with extended reasoning could spend the entire reply budget on thinking and finish with no visible answer. That case is now caught and retried once with a much larger reply budget and a nudge to answer directly.
- **Flow menus stay inside the frame.** The model and template dropdowns could open partly outside the visible area near a screen edge. On narrow screens they now open as a bottom sheet that is always fully visible.

### Added

- **The Tasks page can be searched, filtered and cleaned.** A search box, status filters with counts (All, Active, Done, Failed, Stopped), newest-first ordering, and a one-click "Clear finished" that removes every completed, failed and stopped task - running and pending ones always stay.

### Changed

- **The task time limit can now be set up to 60 minutes** in Settings, for long-running local models that need room to work.

## v12.5.0 - Skills

Skales learns skills: a built-in library it can reach for on its own, style packs that give Studio a committed aesthetic, ready-made agent teams - and an agent that keeps working instead of stopping halfway.

### Added

- **A built-in skill library, ready on install.** Skales now ships with a curated set of working skills - disciplined bug diagnosis, relentless plan interviews, research with cited sources, test-first coding, handoff documents and more. Skills marked automatic are picked up by the AI on its own when the task fits; the others run when you name them. Every skill shows its author and license right on the card, the library is searchable with category filters, built-ins cannot be deleted (only switched off), and any skill you import under the same name simply takes over.
- **Skills in chat, on demand.** Mention a skill with @ or just ask for it by name - the AI loads the full instructions itself before acting.
- **Style packs for Studio.** 74 aesthetic references - each clearly labelled as inspired by a well-known product or brand look - can be pinned to a Flow project. A pack shapes typography, color and layout mood; your brief always wins on content, and no real logos or trademarks are ever reproduced.
- **Flow knows its skills.** The Flow landing gets two new controls: pin up to three skills that ride along on every step of the project, and pick a style pack next to the Brand Kit. Your choices show as chips on the first message, so a project always tells you how it was set up.
- **Ready-made agent teams.** Organization offers five presets - Research, Build, Analysis, Content and Ops - each with sensibly prompted roles. One click creates the team; everything stays editable, and building a team from scratch works as before.
- **Images carry their origin.** A picture that really came from image generation wears a small origin badge - text that merely claims a picture does not. The generation prompt now sits in a collapsible "Show prompt" section under the image instead of flooding the chat.

### Changed

- **The agent finishes what it starts.** An answer that ends mid-plan is no longer the end of the turn: with open checklist items or an announced next step, Skales continues on its own instead of waiting for you to type "continue".
- **Scheduled work resumes itself.** A scheduled task that hits its time limit while still making progress now queues its own continuation and picks up from the checkpoint - overnight jobs no longer stall until someone pushes them.
- **One schedule, once.** Creating the same schedule twice is refused with a clear message instead of silently doubling future runs.
- **Downloads tell the truth.** A downloaded file is checked against what it claims to be - an error page pretending to be an image fails loudly instead of leaving a broken file behind, and re-fetch attempts identify the app honestly.
- **Websites that block the built-in browser now say so.** Instead of failing quietly, the run explains the block and points to the visible-browser login handoff.
- **Knowledge-graph import shows real progress** instead of sitting at zero for minutes.
- **Every provider key can be removed** - including the ones that previously had no remove button.
- **Long-term memory learns only from real conversations.** Automated feeds and error messages no longer qualify as facts about you.
- **Quitting means quitting.** The power buttons close the app and its background helpers for real instead of reloading the window.
- **A cancelled goal says so once.** The cancel notice appears exactly one time and no longer returns on every reload.

### Fixed

- Push notifications tapped on the phone open the exact conversation they belong to, even when the app was fully closed.
- Attached documents with embedded pictures no longer flood the conversation with image requests.
- Image messages no longer show stray formatting fragments beneath the picture.
- The Flow file panel closes properly, and long file writes no longer end with the whole page pasted into the chat.

## v12.4.5 - Checkpoint

The release that locks the doors before adding more rooms: remote access becomes one honest switch, pairing asks you first, videos work from the first message, and your phone can hand the desktop videos, PDFs and its whole photo batch.

### Added

- **Remote access is one switch, default off.** Off means the server listens only on this machine - in a hotel or cafe network the port simply is not there. On means reachable over LAN/Tailscale AND token-protected, as one inseparable setting; the in-between that used to be the default (reachable, no token) no longer exists. The access token now survives restarts, and Settings > Security shows it at the very top with a copy button, a QR code and a regenerate button. Swarm users are unaffected: an enabled Swarm keeps the port open for its peers.
- **Pairing asks you first.** A phone (or any device) that knocks with your pairing code no longer connects by itself: the Mobile page shows who is asking - device name plus the tail of its key - and you allow or refuse. Your Allow counts only for the device you were shown, refusing is "not now" rather than a ban, and unanswered requests expire on their own.
- **Pair without a camera.** The desktop now shows a copyable pairing string under its QR code - for remote onboarding, headless devices, or whenever scanning is impractical.
- **Video from the very first message.** The chat landing page accepts videos (picker and drag & drop) up to 100 MB, shows a thumbnail chip, and hands the analysis to the same frame-sampling flow the in-session composer uses.
- **Videos, PDFs and full photo batches from your phone.** The bridge speaks a new protocol: the paired app (2.4.5) streams videos and PDFs to the desktop in chunks, every attached image arrives instead of only the first, and the phone can display the desktop's knowledge graph. Older app versions keep working exactly as before.
- **Attach audio, and videos get their soundtrack read.** Drop an audio file into either composer and it is transcribed through your configured speech-to-text provider, then reads like any attached document - with an honest message if no provider is set up. Video analysis now also listens: the soundtrack is transcribed alongside the sampled frames, so "what is said in this clip" finally has an answer. Both are best-effort and never block the run.

### Changed

- **Server actions joined the token gate.** With remote access on, the token now guards the entire local surface - not only the /api routes but the internal action calls pages are built on. Verified against the packaged server: without a token, nothing executes and nothing is written.
- **Frames fold into an accordion.** A video message shows its sampled frames as a compact expandable strip under a thumbnail instead of ten full-size images, and the bubble reads like your question again instead of an attachment note.
- **The knowledge graph stays yours.** Machine-written sessions (briefings) and Skales' own product terms no longer enter the graph - the extractor filters them at every entry point, and Settings offers a one-time cleanup that removes previously collected ones without touching your real entities.

### Fixed

- **Friend Mode no longer double-texts.** Two overlapping schedulers could each generate their own check-in inside one cooldown window - two different messages in the same minute. One in-flight guard now spans both, including across the app's two server bundles.
- **The @ and / menus close when you click away** - and a slow, deliberate click on an entry no longer loses the selection.
- **Stop works while frames are being sampled.** The red stop button now aborts a video analysis during the "sampling video frames" phase instead of only after it.
- **The pairing QR told phones the wrong desktop version** - hardcoded at 10.1.0 since that release; it now always carries the real version.

## v12.4.0 - Piranha

Generated media shows up where you asked for it, your phone sees what the desktop is doing and can stop it, goals know when they are done, and every agent gets its own name, hooks and task list.

### Added

- **Your phone sees a running desktop chat - and can stop it.** When the paired app has a session open that Skales is working on, the phone shows a live banner with a Stop button, streams each tool step as it happens, and receives generated images right in the bubble. The desktop also gained a "send to phone" action that forwards a workspace file or note to the paired app, with a push if the app is closed. Work done from the phone now shows up as proper tool cards when you open that session on the PC.
- **User hooks.** Run your own text snippet or shell command at chat lifecycle points: session start, after a tool result (optionally one specific tool), or when a goal finishes. Command hooks go through the exact same safety gates as the model's own commands, and isolated agents never fire them.
- **Tick the task list yourself.** The checklist Skales keeps in a normal chat is now clickable when the chat is idle: mark items done or undone by hand, and your ticks survive reload. A fresh plan from the model still wins over stale hand edits.
- **Publish over SFTP.** FTP publishing now speaks SFTP as well as FTP and FTPS: pick the protocol per profile, and on the first successful test Skales shows the server's SSH host-key fingerprint and pins it to the profile. If that key ever changes, the next upload is refused, so a swapped-out server can't quietly receive your files.
- **Goals can declare themselves done.** A long-running goal with broad criteria used to be nudged to keep going forever; the agent can now state completion explicitly once the work is verifiably done, and the checker respects it.
- **Isolated agents got a real household.** An isolated agent's generated and edited images stay in its own workspace instead of your gallery, downloads are confined to its folder with a hard size cap enforced mid-download, its dates are labelled UTC instead of your timezone, planner tasks run as the agent that owns them, and each agent can have its own email account without seeing yours.

### Changed

- **Multi-agent runs report in the conversation.** The per-agent progress trace now lives under the message that dispatched the job, and the finished report keeps a compact version of it, instead of a banner over the whole chat.
- **The Knowledge Graph got a proper physics engine.** The map lays out with d3-force, settles quickly at up to 300 nodes (up from 150), and stays smooth to drag, zoom and expand.
- **Media cards are forgery-proof.** Image and video cards in chat render only from real tool results, never from text that merely looks like one, so a model cannot fake a "generated file" card. Video bubbles from before this release show their file path as plain text instead of a card - the file itself is untouched.
- **Images open in the lightbox.** Clicking an image card in chat opens the full-size viewer; the dead "Open in Studio" link on media cards is gone.
- **One-tap deploy knows Cloudflare.** Deploying a Code-mode project now recognises a Cloudflare Wrangler setup alongside Firebase, Vercel, Netlify and an npm deploy script, and points you at your own CLI for anything else.
- **Skales IQ asks for an update when it needs one.** If a build is too old for the Skales IQ service, chat now shows a clear "install the latest update" message instead of a raw error.
- **Custom agents answer as themselves.** Ask a custom agent who it is and it answers under its own name (still honest about the model it runs on) instead of introducing itself as Skales.
- **WhatsApp knows who "me" is.** "Send it to me on WhatsApp" reaches the owner instead of the bot's own number, contacts saved in national format (0676...) match, and a failed media send explains the file path problem before anything leaves the machine. The isolated-agent chat badge became a lock icon.

### Fixed

- **Generated images render in chat and Flow again.** An image produced by the built-in generator shows up as a picture in the conversation and lands in the Flow project folder, on every backend - previously the turn ended early with a broken link.
- **Video generation works in the installed app on every platform.** The Windows build was missing the Google video engine and ffmpeg entirely, and every platform's package now carries the ffmpeg binary for its own operating system instead of the build machine's. Veo model names are consistent everywhere, so the tier you pick is the tier that runs.
- **Finished answers stop re-typing themselves.** At the end of a streamed reply the text no longer wipes and types out a second time.
- **Google Calendar tells you what is actually wrong.** The dashboard widget and calendar tools now name the real cause when the connection fails - an expired authorization (with the 7-day testing-mode hint), missing OAuth fields, or a network error - instead of a generic "reconfigure" line. And an empty week on a connected calendar links to the planner instead of suggesting you set up a calendar you already set up.
- **Web search fails forward.** A failed search names the fallback that will work (fetch the page, extract text), Windows gets shell hints that match its own tools, and the keyless DuckDuckGo path retries with a hard 25-second budget instead of hanging.
- **Three tools were invisible to the model.** A manifest generator gap hid connector building, connector requests and web search from the tool catalog in some setups; all 182 tools are listed again and a guard keeps future descriptions from silently dropping out.
- **A broken video clip cannot stall the chat.** Analyzing an uploaded video now stops sampling after a minute and answers from the frames it already has, instead of hanging on a slow or partly corrupt file.
- **The chat input can no longer stay locked.** In rare cases the composer stayed disabled after a reply finished (Enter and Send dead until a hard reload); a watchdog now releases it whenever no run is actually in flight.
- **A dispatched multi-agent job is always visible.** When the dispatching reply carried no visible tool card, the live worker chips had nowhere to attach and the job looked like nothing had started; they now attach to the latest reply instead.
- **Video renders stop making promises.** After starting a background video render the model no longer invents wait times or tries to poll a progress URL; it states that the render is running and where the finished file will appear.
- **Chat exports skip empty blocks.** A reply that only ran tools exported as an empty "Skales" section; exports now show a compact tools line instead, in both the /export command and the History download.
- **Background runs stop paying for the whole tool catalog.** Multi-agent workers, planner tasks and scheduled catch-up runs used to receive every tool definition (tens of thousands of tokens) on every single step; they now start from the same lean core set as chat and pull extra tool groups on demand. On a metered model this was the single largest hidden cost per day. GLM 5.x models get on-demand tool loading too, instead of always paying for the full catalog.

## v12.3.5 - Flying Gecko

Your knowledge graph comes alive, multi-agent jobs show every worker and finish on their own, and finished work stops being sent twice.

### Added

- **A living map of what Skales knows.** The Knowledge Graph on the Memory page is now a real, explorable network: it settles into shape on its own, you can zoom, pan and drag single nodes, and busier ideas sit larger with a soft glow. Labels fade in as you zoom so a dense graph stays readable, and an Expand button opens the whole thing full-screen. Light and dark both fit, and Reduce Motion drops straight to the settled layout.
- **Watch every agent in a team job.** When Skales fans a task out to several workers, the chat now shows one live chip per worker moving from queued to working to done or failed, with a running count and elapsed time, instead of a single "running" line. Click it to open the Tasks view.
- **A private scratchpad for each conversation.** Skales can now keep its own working notes for a chat and gets a private work folder per session, so intermediate files from one conversation never collide with another. Its notes come back to it at the start of every turn, so a long task keeps its train of thought.
- **Drop a video into chat and ask about it.** You can now attach a video (or drag one in) and have Skales actually watch it: it samples frames across the clip and reads them together, so you can ask what happens, check why a short is working, or figure out how a clip was made, its hook, pacing, cuts and on-screen text. Works with any capable model; camera clips just need FFmpeg, which installs from Settings.
- **Look through a camera.** Skales can now take a single frame from a camera on demand and tell you what it sees: an IP or WiFi camera address, or a camera already set up in Home Assistant (which is how a Ring doorbell is reached). Ask "is anyone at the door" or "what's in the garden", and pair it with a schedule to check a camera every few minutes and only ping you when something changes. It asks before looking, and needs a Vision Provider.
- **Isolated agents with a life of their own.** A custom agent can now be marked Isolated: it runs with its own memory, its own workspace folder and only the tools you hand it, and it never sees your identity, facts or saved memory - not even in the background passes that build your knowledge over time. Pair it with a pinned model, a bound FTP profile and a scheduled goal and it can run a project of its own, end to end. If its definition ever can't be loaded, the run stops rather than falling back to your data.
- **Publish a folder over FTP.** A new publish tool uploads a workspace folder through a saved FTP profile, and profiles can be bound to a single agent so only that agent can use them. FTPS (explicit TLS) is supported and switches on automatically when the server requires it, so hosts like Hetzner work out of the box.
- **Some Discover posts invite your agent along.** A post can now carry a "Let your agent explore this space" button: one tap prepares a visit for your own agent - it reads the site's welcome file, looks around and leaves a short guestbook comment, with your usual confirmations. You review the request before it's sent, and each post can be run once.

### Changed

- **Notifications carry their real button.** Announcements now show exactly the action label they were written with instead of a generic "Learn More", update notices get their own look with a one-tap jump to the in-app update page, and messages can be aimed at desktop or mobile users specifically.
- **Signing in by hand works everywhere.** The visible sign-in window for website logins no longer announces itself as an automated browser, so Google and other providers accept the login instead of blocking it as insecure.
- **Toast messages stay put.** Stacked notifications in the corner could leave an invisible gap behind that pushed each new toast lower until the stack drifted toward the middle of the screen. Old toasts are now always cleared, and any that a background window left stranded are swept up on the next one, so the stack stays anchored top-right.

### Fixed

- **A team job finishes on its own.** When Skales split a goal across several workers, it could stall once they finished and wait for you to nudge it. It now picks the goal back up automatically the moment the workers are done and carries it to the finish, whether or not the chat is open.
- **Finished work is never sent twice.** Re-checking a completed goal could re-run steps that had already happened, so a file or message could go out two or three times. Once a step has genuinely succeeded, its result now counts as proof and is never repeated to "re-verify" it.
- **Ask for an image, get an image.** When you ask for a picture, poster or graphic, Skales now creates it instead of handing back a text description of what it would draw. If no image provider is set up, it says so plainly and points you to Settings rather than quietly returning a prompt. And right after a big task wraps up, a follow-up like "now write the launch post" reuses what was just made instead of starting the search over.

## v12.3.0 - Flying Gecko

Flow checks its own work before handing it to you, long conversations keep their task, the calendar tells you what is actually wrong, and Skales stops getting in its own way mid-work.

### Added

- **Sign in to a website, once.** When a task needs you logged in, like posting on X or checking an order, Skales opens a visible browser window so you can sign in by hand. Your login is saved to the Skales browser profile and reused the next time, so it can work inside your accounts without ever seeing your password. Open a login window any time from Settings, Browser Control ("Log in to a website").
- **Watch the browser work.** A new "Show browser window" switch under Settings, Browser Control opens a real, visible browser window instead of running hidden, so you can see each step as it happens.
- **Multi-line scripts run without shell traps.** Skales can now write a script to a file and run it directly with the right interpreter (Python, Node, Bash, PowerShell) instead of squeezing code through a shell one-liner. On Windows especially, quotes, braces and special characters used to break perfectly good code before it even ran; that whole class of failure is gone.
- **Every file change has an undo point.** Before Skales overwrites, edits, appends to or deletes a file, it quietly keeps a copy of the previous version. If an edit turns out wrong, the earlier version is right there to restore, so a working script can no longer be lost to one bad change.
- **Self-built tools carry a freshness mark.** Each tool Skales built for itself now remembers when it last ran successfully. A tool that has not proven itself recently is marked as such, so Skales tests it before relying on it and reads it before changing it.
- **Flow checks its own work before handing it over.** After Flow builds or edits a deck, prototype, page, or visual, it now takes a picture of the finished result and looks at it the way you would, checking for text that runs off the edge, unreadable contrast, pieces cut off outside the frame, or a layout that has collapsed. If it spots a clear rendering problem it quietly fixes that one thing and shows you the corrected version. It makes at most one extra pass, never holds up a finished draft, and only steps in when a Vision Provider is set up. You can switch it off under Settings, Vision Provider.
- **Fill your memory graph from what Skales already knows.** Once you turn on learning in Settings, Memory, the Knowledge Graph can now be seeded in one pass from your saved long-term facts and a slice of your recent chats, instead of only filling up reply by reply going forward. Choose how much history to pull in, watch it count through in the background, and stop it whenever you like. Running it again never creates duplicates.
- **Your desktop makes Studio visuals for a connected phone.** When your phone is paired in remote mode but has no provider key of its own, it can now ask your desktop to build a Studio visual for it. The desktop generates it on the side and sends back the finished design, without ever adding anything to your chat history.
- **Friend Mode can reach your phone.** Turn on "Mobile App" in the Friend Mode channels and your desktop's proactive check-ins are sent to your paired phone too, where they land in your Buddy thread. It uses the same cooldowns and quiet hours as every other channel, and the message stays encrypted end to end.

### Changed

- **Browsing is faster, cheaper and more reliable.** Skales now reads and acts on web pages far more efficiently: clicks and typing land precisely, long browsing tasks cost noticeably less, and even smaller local models can drive the browser now.
- **The Proactive operator says what it is waiting for.** An empty operator pane on the Memory page used to show only "No initiatives yet", which read like a broken feature. It now explains what Skales is watching (upcoming meetings, failed scheduled tasks, blocked work, unread email) and shows when the last background check ran, so quiet genuinely reads as good news.
- **Skales reads before it edits.** Changing a file it has not actually looked at in the current session is now refused once, with the instruction to read it first. What is on disk can differ from what the model remembers, and blind patches on working scripts were the main way tools got destroyed.
- **Failing approaches now end in an honest question, not a seventh attempt.** When the same tool keeps failing, Skales first gets told exactly what failed and is pushed to step back and test one hypothesis at a time; if the failures continue, it stops trying on its own, summarizes what it attempted, names its best guess at the cause, and asks you for the one thing it needs. No more endless rabbit holes.
- **Unrestricted mode keeps its word.** A few command rules used to stay blocked even with Safety Mode set to Unrestricted. In true Unrestricted they now run instead of being refused, and the result card in the chat carries a clearly visible amber warning strip naming what was flagged, pinned to the exact command it belongs to and kept in the conversation history. Safe and Advanced keep their protections unchanged.
- **The working glow is easier to notice.** The ambient background that breathes while Skales works now drifts further, on a slightly quicker rhythm, and sits a touch more present at its peak, so you can actually see that something is happening. It stays well within readable contrast, idle stays still, and Reduce Motion still switches it off entirely.

### Fixed

- **Long conversations no longer lose track of the task.** In a long session, especially one with many working steps, Skales quietly fed the model only the most recent stretch of the conversation, so the original request could fall out of view while the context meter still showed plenty of room, and a later remark could be mistaken for the task itself. The model now always works from the full conversation, sensibly condensed, and the original request stays anchored no matter how long the session gets.
- **Work already done is not redone.** When a long task was interrupted and you asked Skales to continue, it could lose track of the files it had already written, claim a script was gone, and write it again from scratch. Skales now keeps a live list of everything the task has written, checks that each file is really on disk, and picks up from there instead of starting over.
- **Skales changes course instead of giving up.** When a step kept failing the same way, Skales used to stop with a generic "I got stuck" message, throwing away an otherwise healthy task. It now tells the model exactly which call keeps failing and why, blocks that one call, and pushes it to try a different approach; only if it still cannot move on does it stop, and the stop message now names the step that jammed instead of leaving you guessing.
- **The calendar tells you why it is empty.** If none of your configured Google calendars could be read, most often because a calendar's display name was entered where its ID belongs, Skales showed an empty calendar as if you simply had no events. It now says which entries failed and how to fix them, and the settings field explains where to copy the real Calendar ID from. One broken entry among working ones still does not disturb the rest.
- **The Memory page tells the truth about Knowledge Graph learning.** The graph card claimed new facts were extracted automatically after every reply, while that learning is actually a switch that ships off, hidden under a name nobody connected to the personal graph. The card now says plainly whether learning is on, and the switch that controls it lives right there with an honest name.
- **Skales knows which Safety Mode it is running in.** Asking which mode is active used to get you a guess or a request to check Settings yourself. Skales is now told its active mode and what that mode means, and answers directly.
- **Legitimate commands are no longer refused as dangerous.** A handful of everyday commands, such as scheduling a task on Windows or listing output with a format flag, were wrongly treated as system-destroying and refused regardless of your Safety Mode. Command safety is now decided in one place, honours your chosen mode everywhere, and only the genuinely destructive commands stay blocked.
- **Windows: scripts no longer crash on special characters.** A Python script that printed an emoji or other non-Latin text could die with an encoding error on Windows. Script output now uses UTF-8 there by default.

## v12.2.5 - Past Freeze

Your phone can now start, watch and stop the work your desktop does. Agents know who you are and what day it is. Vision lands on the right provider, the composer never stays stuck, and Flow stays out of your chats.

### Added

- **The chat background breathes while Skales works.** The accent glow slowly grows and drifts while your question is being thought through, stays a touch more present while the answer arrives, and settles back when it is done instead of snapping off. A running goal gets its own livelier, greener state, so you can tell at a glance that something is still working for you. The thinking dots and the status bar move on the same tempo. Nothing moves while Skales is idle, the animation stops while the window is in the background, and it is off entirely when your system asks for reduced motion.
- **Skales Mobile is on the App Store.** The Skales Mobile page now links the App Store next to Google Play, and the iOS button opens the store in your browser like the Android one. The in-app guide and roadmap note both stores are live.
- **Start a goal from your phone.** A request the phone marks as a goal now runs on the desktop as a proper background goal, on its own session with its own plan, instead of one long blocking reply. It keeps working after the phone acknowledges it, so you can close the app and come back to the result. Goals honour the Settings goal switch and need a real provider (your own key or a local model), like the scheduled goals.
- **Control a goal from your phone.** The Skales mobile app can now list the goals running on your desktop and stop, pause, or continue any of them. Stop and pause halt the live work at once, the same as the desktop.
- **Get notified on your phone when a goal finishes.** When a goal started from your phone completes, pauses for input, or stops on an error, the desktop notifies that phone, even if the app is closed. The notification is routed only to the phone that started the goal, and it arrives as its own message so it never interrupts whatever else you are doing in chat.
- **Your phone sees the live plan.** When the desktop works through a multi-step task from a phone request, it sends the same step-by-step checklist to the Skales mobile app, which shows it as a strip above the chat, updates it the moment a step changes, and brings it back when you reopen the conversation.
- **Goal and origin badges reach your phone.** The desktop now shares each session's goal progress and whether it started on a phone, so the phone shows the same goal pill and Mobile badge you see on the desktop.
- **Browse and fetch desktop files from your phone.** The phone's Workspace shows a Desktop folder while connected: browse your desktop workspace and pull any file (up to 2.5 MB) to the phone over the encrypted link. Read-only and strictly limited to the workspace folder.
- **Finish a connector's setup from your phone.** The Skales mobile app can now list your desktop's API connectors and complete the parts that used to require the desktop: confirm the connector's domain and set its key (and the client id and token address for OAuth2). The key is sent once, stored encrypted, and never read back; confirming the domain and setting the key stay separate steps.
- **Discover shows when someone forks a skill or template.** Forking a skill or a template now posts a short note to the feed, the same way sharing does, and only when feed sharing is turned on.
- **Safety Mode now has three levels: Safe, Advanced and Unrestricted.** Safe blocks dangerous shell commands and asks before critical actions. Advanced runs without asking and allows dangerous commands, while a residual guard still refuses the handful that would destroy the machine or its data outright. Unrestricted removes those last blocks too and, with file access also set to unrestricted, lets Skales reach system locations, install software and talk to hardware. If you were on the old Unrestricted, it is now called Advanced with identical behaviour, and a one-time note on first start points you to the new, genuinely unrestricted mode. You change it under Settings, Security, or during onboarding.
- **Name an image or video model in plain words.** You can ask for a model by loose name, for example "flux schnell", "gemini flash" or "veo 3.1 flash", and Skales matches it to a model your providers can actually run, picking the right backend for it. If the name is ambiguous it asks which one you meant instead of quietly falling back to a default.
- **Skales can set up an API connector from documentation, mid-conversation.** In Advanced or Unrestricted mode, after reading a service's API docs Skales can scaffold one of your REST connectors during the chat. The connector is saved switched off and without a key; you confirm the address and enter the key yourself under Settings, API Connector before it can be used, so the key never passes through the model.
- **API connectors speak OAuth2 (client credentials).** A cloud API that exchanges a client id and secret for an access token at a token endpoint, like Husqvarna or Gardena smart systems, now works as a connector: pick "OAuth2 (client credentials)" as the auth scheme, enter the token URL and client id, and put the client secret in the key field. Skales fetches and refreshes the token on its own, entirely on your machine. Static extra headers such as an application key are supported too.
- **Tools Skales builds for itself survive the session.** When Skales writes itself a working script, say a Bluetooth scanner or a TV caster, it keeps it. Every future conversation knows about those tools, so Skales reuses what it already built instead of starting over.

### Fixed

- **Agents now know your saved facts and today's date.** A custom agent, or an agent from the Agents page such as the Research Analyst, ran with its persona only: none of your Knowledge & Facts applied, and it did not know what day it is, so a web research report could carry the publication date of its sources as the report date. Every agent now gets the real current date, is told that a date found in a source belongs to that source and is never today, and receives the facts you saved. Agents that read the web are also held to the same rules about untrusted content as the rest of Skales.
- **Your saved facts survive minimal compression.** With compression set to minimal, or chosen automatically for a small local model, what Skales knows about you was shortened so aggressively that every entry under Memory, Knowledge & Facts fell away, so a fact you explicitly saved was simply absent when the model answered. Your saved facts are now always kept.
- **Stopping a running goal from the header now actually stops it.** The Stop control on the goal activity pill only marked the goal stopped without halting the work, so it kept running and reappeared on the next refresh. Stop and Pause now halt the live run at once. A stopped or crashed goal also no longer silently resumes itself on your next message: an interrupted goal is parked so it only continues when you choose Continue, and a goal that hit an error is marked failed and leaves the active list instead of looking like it is still running.
- **A long task no longer times out on your phone while the desktop is still working on it.** In remote mode a request that ran long (a goal, a slow build, one long model step) was given up on and its real answer dropped, and a retry re-ran the whole thing. The desktop now keeps the phone informed while it works, so the phone waits and the answer arrives.
- **OpenRouter works as your Vision Provider.** Switching the Vision Provider to OpenRouter kept sending image reads to whatever address a previous provider had left behind (a local Ollama, for example), so every read failed with a "not found" error even with a valid image model, while the exact same endpoint entered as a custom provider worked. OpenRouter now always uses its own address, a leftover address from a previous provider is cleared the moment you switch providers, and a "not found" error now names the model and how to correct its id.
- **The image description sits under the picture, inside your message.** The collapsed eye view with the Vision Provider's description floated above the message bubble instead of belonging to it. It now sits inside the bubble directly under the attached image, styled to read clearly on the bubble's background, both live and after reloading the conversation.
- **The composer no longer stays stuck after a reply stops responding.** If a reply stalled partway (a hung tool call, an orphaned run, a dropped connection), the input stayed locked with no way to send until you reloaded the page. It now releases on its own after a run goes quiet for too long, with a short note that you can send again, and without stopping whatever the server is still doing. Typing in very long conversations is lighter too.
- **Skales Visuals no longer times out while it is still working.** Creating an image or visual in Flow could fail with "the operation was aborted due to timeout" even while the model was actively writing, because a full single-page visual routinely takes a while. Flow now allows the whole generation and only gives up on real silence, and when a timeout does happen the message explains what stopped and suggests trying again or picking a faster model.
- **Forked and created templates appear in your library.** Forking a template from Discover, or creating one, showed a success message but the template never appeared under Templates, because the library never read your saved custom templates. They now show up with a Custom or Forked chip and a delete button, so a mistaken fork is not permanent, and a forked template carries its full prompt instead of a short preview.
- **Flow projects stay out of your chats.** A Flow (Studio) project could surface as a recent chat on the dashboard, in history, in the command palette and on your mobile device, and finishing a Flow turn popped a "finished your chat reply" note that opened the Flow conversation inside the chat view. Flow projects are now kept out of every chat list, a finished Flow turn shows a Flow note that reopens the workspace, and opening a Flow project link sends you to Flow instead of rendering it as a chat.
- **Long answers from Ollama Cloud models no longer cut off mid-sentence.** A strong model served through Ollama Cloud was limited to a small answer length regardless of what it could actually write, so longer replies stopped partway. Each family now uses its real answer length, and you can still raise it under Override Model Limits.
- **Ollama Cloud models use their tools instead of just talking about them.** A frontier model running on Ollama Cloud was treated as if it were small hardware on your own desk, so it described what it would do instead of doing it, and a slow first response could wrongly mark it as not supporting tools at all. These hosted models are now recognised for what they are.
- **Reasoning no longer leaks into the chat as "[thinking]" text.** Some models write their private reasoning inline using square brackets, which showed up as literal "[thinking]" text in the reply. That reasoning now goes into the collapsed Reasoning section like every other model, and the visible answer stays clean.
- **Image generation works when your only provider is fal.ai or Replicate.** Asking for an image in a chat or a Flow could return a written description instead of a picture when the only image key you had configured was fal.ai, or a Replicate key stored the newer way, because those two were overlooked when deciding whether to offer image generation. Every image provider you have configured is now recognised, so the tool is offered whenever any of them can produce an image.
- **A PowerShell display command is no longer mistaken for disk formatting.** Formatting command output for display (for example listing Bluetooth devices with Format-Table, Format-List or Format-Wide) was refused as if it were a drive-format command. Only real drive formatting stays blocked now; the display formatters run.
- **Pairing a phone opens the right panel and confirms right away.** After scanning the pairing QR code, the panel jumped to Settings instead of Connected Devices, and a scan showed no confirmation until a background refresh caught up. It now opens Connected Devices immediately with a success note.
- **Removing a paired phone really cuts it off.** Removing a device only closed the current connection, so the phone could quietly reconnect on its own. Removing a phone now tells it to forget this computer and refuses to re-pair it until you deliberately show a fresh QR code, so a removed device stays removed.

### Changed

- **The interactive Playground is taking a break.** The mini-app builder is temporarily unavailable while it is reworked and will return in a later release. For now its sidebar entry, its Settings tab and its Add-Ons card are hidden, including for anyone who had it switched on.
- **Skales IQ is described as free included usage, not a trial.** The Skales IQ copy now makes clear it is free included usage rather than a trial of a paid plan, with nothing to buy: when the included usage runs out you connect your own provider and everything keeps working. Added an explicit "this is not a subscription" line to the Skales IQ settings box.
- **Flow places your attached images instead of redrawing them.** In a design or build project, an attached image is now described so the model knows what each file shows and embeds the actual file where it fits, instead of trying to recreate the picture in code. In an image or video project the attachment still passes straight to the generator untouched, so an edit works on your real picture.


## v12.2.0 - Freeze

The first release after the freeze: images answer with the model you chose, the ChatGPT subscription works everywhere, and profiles keep their full guidance.

### Fixed

- **Synced model profiles keep their full guidance.** An imported tuning profile's guidance text was cut at 600 characters on import, which silently truncated every profile in the shared library mid-sentence and dropped the tail of the instructions. The bound is now generous enough for a real multi-rule hint, and a profile that still exceeds it is logged instead of being trimmed in silence.
- **Images keep your chosen chat model.** When a dedicated Vision Provider read an attached image, the answer was silently handed to a different model than the one you picked (a local vision model, or a small cloud fallback), so the reply looked like it came from the wrong place and, on paid providers, billed the wrong model. The picture now goes to the vision model only when a raw image is actually sent; once the Vision Provider has described it, your chosen chat model answers. Vision-capability detection now reads what the local model actually reports instead of guessing from its name, a Vision URL that already points at the chat endpoint is no longer mangled into a broken address, an explicitly chosen local vision model is attempted instead of pre-blocked, and the image-related tips and error messages now point at the Vision Provider settings. Profiles can also carry a vision-capability override so a new model is recognised without an app update. A picture and its description are now saved with the conversation, so the very next question ("what did you see?") is answered from what was actually read instead of "I do not remember", and a failed image read no longer vanishes from the history. The saved description shows under the image as a small collapsed eye accordion (like the reasoning view), never as raw text in the bubble.
- **The ChatGPT (Codex) subscription is selectable everywhere.** A signed-in ChatGPT account never appeared in the model pickers (new-chat landing, in-session switcher, picker search, agent and Codework provider dropdowns) because those lists only recognised API-key credentials; the subscription sign-in now counts as configured and the Codex models show up like any other provider's. Flow already offered it.
- **Every surface reads image capability from one place.** Telegram kept its own list of which models can see, with the multimodal gemma3 and gemma4 families wrongly marked text-only, and several surfaces disagreed about what counts as a local vision endpoint. Chat, Telegram, WhatsApp and the desktop buddy now decide this the same way, a pasted address is tidied up first, and the buddy no longer insists on a vision model id where every other surface accepts the built-in default.
- **The ChatGPT (Codex) subscription is on one tested path.** The plain-chat and tool-using code for a signed-in ChatGPT account had drifted into two hand-copied copies, which is how the subscription kept breaking one release at a time; both now share a single request builder and stream parser covered by tests, so a fix can no longer land in one and miss the other. The current model list gained GPT-5.5 (an up-to-date id was falling through to the manual entry field), and a short-lived access token is now refreshed automatically before a turn instead of leaving a still "signed in" account failing every message until a manual sign-out and sign-in.

## v12.1.1 - Freeze

Long-running tools, portable backups, and Flow polish.

### Added

- **Send several images in one message.** Pasting, dragging or picking multiple pictures used to keep only the first one; now up to five images ride along per message, on the new-chat landing as well as in a running session. Each queued image shows its own preview with its own remove button, a shared window capture joins the same queue, the model receives all pictures in one turn (a dedicated Vision Provider reads each one and hands over numbered descriptions), all of them are saved with the conversation and shown in the bubble, and editing a message that carried several pictures resends all of them.
- **Discover marks mobile posts.** A post made from the Skales mobile app shows a small phone icon next to its timestamp, matching the marker in the mobile feed. Under the hood the device bridge gained session control and a tool catalog for the next mobile release; everything is additive, a current mobile app is unaffected.
- **Wrapped share cards get more looks.** The weekly recap card now offers nine themes (Skales, Obsidian, Snowfield, Neon, Sunset, Rose, Aurora, Grape and Teal), each in a light and a dark variant, chosen from a swatch picker right above the card. The choice is remembered for next week, and the download, copy and share-to-Discover buttons all export the themed card.

### Changed

- **Flow designs with a stance now.** Every authored mode carries a design essence on top of its structural seed: commit to one aesthetic direction instead of a safe generic middle, name the system (layout family, fonts, background rhythm) before building, let typography carry the hierarchy, give each artifact one hero moment, treat whitespace as material, and make requested variants genuinely divergent. Each mode adds its own craft posture - slides think in sequence rhythm, motion thinks in beats with anticipation and one reveal, mockups respect platform conventions and touch targets, wireframes stay deliberately negotiable, documents read as typography with structure - each with concrete taste anchors. Real photography from Unsplash and Pexels joins the asset sourcing (downloaded into the project, never hotlinked), and a design that wants more typographic character may swap the seed's font tokens for a characterful pairing; motion compositions stay fully offline.

### Fixed

- **Windows commands run in the right PowerShell.** Agent commands on Windows were hardwired to `powershell.exe`, which is always Windows PowerShell 5.1 - a shell that rejects `&&`/`||` chaining, so every chained command a model wrote failed and had to be retried in single steps, burning time and tokens. Skales now runs agent commands in PowerShell 7 (`pwsh`) whenever it is installed and only falls back to 5.1 without it; on top of that, the agent is told exactly which shell it is in (in chat, Codework and the Telegram bot alike), so even on 5.1 it writes `;`-separated PowerShell commands correctly on the first try instead of learning it from errors. Linux setups also get their own platform hint instead of borrowing the macOS one, and the batch-folder shortcut in the prompt now shows Windows syntax on Windows.
- **Discover links that contain a `#` are clickable again.** A shared or auto-posted link whose URL had a fragment (the `#section` part, e.g. a Wikipedia section or an app deep link) had that fragment mistaken for a Discover hashtag: it was pulled out and highlighted as a tag, leaving the rest of the URL as dead, unlinked text. Feed post text now recognises URLs first, so the whole link stays one clickable link (opening in your browser) and only real standalone `#hashtags` are highlighted.
- **Backups no longer lose FTP passwords or stored secrets across machines.** The portable-secrets export covered the settings and connector keys but missed the two stores that encrypt in a different format (the internal secret store and saved FTP profile passwords); those travelled as the source machine's ciphertext and, with the encryption key deliberately kept local, silently vanished on restore to another machine. They now travel in the same portable form and are re-encrypted with the receiving machine's key; anything genuinely unrecoverable is reported instead of dropped.
- **The 1:1 Wrapped card is square again.** The share card labelled 1:1 was rendering as a cropped portrait: sized as a flex item, it was squeezed narrower than intended while its height stayed fixed, so the content overflowed and the corners were cut off, and the exported image inherited the same wrong shape. The card now holds its exact intrinsic size, the on-screen preview is scaled separately to fit the window, and the content is measured and scaled to fit the box, so 1:1 exports a true 1080x1080 square and 9:16 a true 1080x1920, with nothing clipped in any language.
- **Custom skills can be shared to Discover again.** The Skill AI generator added `require('fs')` and `require('path')` at the top of every skill even when the skill never used them, and the share screen rejects any skill that touches the file system. A share now strips those unused requires first (a require that is actually used still stays and is still screened), so a pure-compute skill is no longer blocked by dead boilerplate, and newly generated skills omit the unused imports.
- **Detect Ollama knows about Ollama Cloud.** With Ollama Cloud switched on, the Detect button and the failure messages used to tell you to start a local daemon (`ollama serve`), which is nonsense for the hosted service. They now point at your Ollama Cloud key and connection instead, and the provider is simply labelled "Ollama" (not "Ollama (Local)") since it can be either.
- **The Telegram bot names the real problem.** A network drop while polling (DNS failure, reset, timeout) was logged as "bot may have an invalid token", sending you to check a token that was fine. Network errors are now labelled as network errors (and recover on their own), and only a genuine rejection from Telegram is reported as a token problem.
- **API connectors that need two query credentials work now.** Some APIs authenticate with a public application id next to the secret key, both in the query string (Adzuna's `app_id` + `app_key` is the common one). The connector could only carry a single credential, so these always failed. A connector now has an "Extra query params" field for the public companion (sent in the clear, never encrypted, kept out of the model context), the secret query parameter's name is editable instead of a fixed `api_key`, and the docs importer recognises the two-parameter pattern automatically. On top of that, saving a connector with an auth scheme the request layer does not understand is now rejected with a clear message instead of silently sending an unauthenticated request that reads back as the API rejecting the key.
- **MCP tools get the time they need.** Every MCP request was cut off after a blanket 30 seconds, which aborted legitimately long operations (video analysis, renders, large scrapes) in the middle of their work. A tool call now has five minutes by default, each server can raise or lower that on its own up to 30 minutes, and the quick control requests such as connecting and listing tools keep their short timeout so a hung server is still detected fast.
- **Ollama reads images reliably, including Ollama Cloud.** Pictures sent to Ollama went through the OpenAI-compatible endpoint, which the hosted vision models answer with a server error; the same models describe the same image fine on Ollama's native chat endpoint. Skales now routes image turns over the native endpoint automatically - no setting, no URL to change - and text conversations keep exactly the path they had.
- **Claude over OpenRouter stopped re-paying its own prompt.** The direct Anthropic connection has long cached the static prompt prefix (tool schemas plus system prompt), but the same Claude model routed through OpenRouter sent no cache marker and re-billed that whole prefix on every turn. Claude models through OpenRouter now reuse their cached prompt the same way the direct connection does, so long conversations cost what they should; the volatile clock line stays outside the cached span so the cache survives minute boundaries, and every other vendor's request is untouched.
- **The OpenRouter speech model is actually spoken through now.** The provider card has offered a speech (TTS) model slot, but no read-aloud surface read it: chat read-aloud fell back to the system voice and voice notes only ever used the dedicated voice providers. With an OpenRouter key and a speech model configured, read-aloud in chat, WhatsApp and Telegram voice notes, Studio voice and the AIPointer overlay speak through OpenRouter first; an explicitly chosen voice provider (ElevenLabs, Azure, OpenAI, local) still wins.
- **Settings backups travel between machines.** Exports now carry secrets in a portable form while the local encryption key never leaves the machine; imports re-encrypt everything with the receiving machine's key instead of overwriting it, older backups migrate automatically, and anything unrecoverable is reported instead of silently dropped.
- **Thinking stays out of the chat.** Reasoning models (the DeepSeek, Qwen, GLM and MiniMax families among them) that spent a turn thinking could get their entire thinking transcript posted as the visible answer, in Flow a wall of inner monologue instead of the design file. The trace now stays on its own collapsed channel: a turn that burned its budget mid-think recovers with a re-request instead of dumping the transcript, an answer cut off inside its thinking block is treated as thinking, and the Flow live preview hides inline thinking while the model works. Plain helper calls on local reasoning-only models keep working as before.
- **The Flow window lost its redundant close button.** Flow runs in its own window, so the corner X only duplicated the window's own close. The project-files button moved into the preview and editor toolbars as the first icon of one right-aligned row next to the other actions.
- **The Flow composer got wider.** The attach button now sits above the send button in one column, so the message field takes the full remaining width.
- **The Start button looks like a button again.** Inside the Flow window it rendered without its styling; it is now the same accent icon button as the chat send button, and the scoping-questions Continue and Brand-Kit create buttons got the same treatment.
- **Editing a message keeps its picture.** Editing a question that carried an image resent only the new text: the image was silently dropped and the model answered blind. The edit now re-attaches the original picture from its saved copy (with the in-bubble thumbnail as the fallback), so a reworded question about an image still sees the image.
- **The new-chat page remembers your agent.** The agent picker on the chat start page reset to Skales on every visit, so anyone who mostly chats with one custom agent had to reselect it each time. The picker now remembers the last choice for the next visit. Skales stays the default character: nothing is stored until you pick someone else, picking Skales again clears the memory, and a deleted agent falls back to Skales.
- **Approving a phone-driven action replies to the right message.** When a chat run from the Skales mobile app pauses on a tool that needs confirmation (sending an email, pushing to git, running a command), the desktop asks the phone to approve or reject and, once you decide, sends the result back. That reply now carries the conversation's id through the whole approve-reject round-trip - the initial request, any follow-up approval, the final answer and the error path - so the phone pairs it with the exact message that was waiting instead of guessing by order, and a reply missed while the phone was briefly offline still settles cleanly. Local and non-mobile use are untouched.

## v12.1.0 - Flow

Design by conversation. Studio gets a new front door.

### Added

- **Flow, the conversational design workspace.** Open Studio and describe what you want; the Skales agent designs it as real files, with a live preview, the files and the code sitting next to the conversation. Eight modes cover the ground: slide decks, interactive prototypes, wireframes, mobile app mockups, print documents, generated images, generated videos, and motion graphics that render to a real MP4. Every mode carries its own design discipline, so the first result already looks deliberate instead of improvised. Flow is a beta.
- **Flow opens in its own window.** In the desktop app, Flow gets its own window so you keep working in chat and the other tools while a design generates. In the browser it stays an in-app overlay.
- **A composer that carries real controls.** Attach up to ten files (documents like PDFs become content sources the agent reads, not decoration), reference an earlier Flow project, pick a Brand Kit, pick a template, and choose the model and reasoning effort per project. The model picker searches the same live catalogs as the chat page, favourites and recents included.
- **Brand Kits drive the design, including what to avoid.** The Brand Kit gained fields for what the brand is, reference links the agent studies before designing, free design notes, and explicit bans: fonts, design directions and anything else that must never appear. Activating a kit in Flow makes the palette, the typography and the bans binding for every artifact, and a toggle makes the logo and uploaded brand assets a requirement, not a suggestion. New kits can be created right inside Flow; the settings page remains the full editor for the default kit.
- **Templates that shape the output, not just the prompt.** Picking a template (pitch deck, invoice, dashboard, logo reveal, ...) binds the right mode and injects a structural directive into every turn of the project, so a pitch deck follows a pitch deck's arc even five edits later.
- **Media generation with a choice of engine.** Image and video modes list every backend that is actually usable right now: connected MCP media servers, the configured cloud providers, local engines, and Skales Visuals, the built-in engine that designs images and videos itself, at the exact format you asked for, no external image model needed. Pin one, set aspect, resolution, quality and duration, and optionally name the model you want.
- **Generated images can be edited by talking.** Ask for a change after an image lands ("make the keyboard white") and the agent treats it as an edit of the existing file, through the image-edit tool or the media server's image-to-image, saving each revision as a new file.
- **Skills and connectors answer to "@" in Flow.** Typing "@" in a Flow composer lists your imported agent skills and connected MCP servers; a mention activates the skill or steers the turn to that server, the same way the chat composer does it.
- **Flow artifacts land in the shared gallery, and images can go to Discover.** Generated media is mirrored into the Studio gallery automatically, every turn shows a card of the files it produced, and any image artifact can be submitted to the Discover feed, compressed and reviewed before it appears.
- **Discover can now carry video posts.** The feed renders link-based videos with a muted inline player that respects the clip's format, moderated the same way as images.
- **OpenRouter carries every modality now.** One OpenRouter key no longer means text only: the provider card gained per-capability model pickers, fetched live from the catalog and filtered to what each capability actually accepts, for image generation, video generation, music, speech (TTS), transcription (STT) and embeddings. Image models join Studio and Flow as a first-class engine, video models generate through the async job API with honest progress and errors, voice input can transcribe over OpenRouter, read-aloud can speak through a dedicated speech model with a voice of your choice, and the semantic document index can embed through OpenRouter as well.
- **Skales IQ inherits the same breadth, tier by tier.** Skales IQ now understands every modality (chat, vision, image, video, music, speech, transcription, embeddings), and what your plan can do is managed per tier and can grow without an app update. A capability that is off or not in your tier answers with a clear message in chat instead of a cryptic failure, the same way an offline Skales IQ already does.
- **Drag and drop lands in ongoing chats.** Dropping a file onto the composer of a running conversation now attaches it, PDFs through text extraction, images to the vision slot, text inline and archives to the Workspace, exactly like the paperclip. The starting page accepts PDFs and archives too, and a PDF that cannot be parsed still attaches with a Workspace copy instead of being skipped.
- **Flow asks before it builds.** On the first turn of a project, when the brief leaves essential decisions open, the agent poses a handful of tailored scoping questions rendered as a clickable form in the preview pane: option chips, multi-select where several picks make sense, a free-text field and "Decide for me" per question. Continue sends the picks back and the artifact is built to them; a clear brief skips the questions entirely.
- **A template gallery on the Flow home.** All twelve templates fan out as cards under the composer; hovering one previews its brief right in the prompt box, clicking binds the matching mode and structure, and a blank-project link sits below.
- **Change course mid-project.** The Flow workspace header carries a small toolbar: switch the model (with live catalog search) or switch and deactivate the Brand Kit for the next turn, without leaving the project. The workspace composer gained an attach button too, so fonts, images and archives can join a running project, and a live token counter shows what a run actually costs.
- **Skales unpacks zip archives.** A new extract tool unzips archives natively (no shell), guarded against path escapes, available to the agent in chat and everywhere else. A zip attached in Flow is unpacked automatically into its own assets folder.
- **Ollama Cloud, one switch away.** The Ollama card gained a Cloud toggle in its own row: flip it, paste your ollama.com account key, and Fetch Models fills the regular model list with your hosted models, no local install involved. Detection doubles as a cloud connection check, the local-install sections (setup, marketplace, the local tool cap) step aside in Cloud mode, and the hosted frontier-size models are treated as the cloud models they are, with none of the local limits.
- **Your OpenRouter choice leads.** When OpenRouter is the active provider or one of its modality models is pinned, image generation, voice transcription and read-aloud speech go through OpenRouter first; the other configured providers remain fallbacks.

### Changed

- **The classic Studio surfaces moved behind one "Studio v1" group.** Design, Media, Audio, Type, Scenes and Gallery keep working exactly as before, folded into a collapsible rail entry below Flow while Flow is the front door.
- **The Studio landing for Flow is honest about readiness.** One column: the checks on top with a wide open button, the explanation below. Configured MCP servers count as ready (they connect on first use), and the media row mirrors, key for key, what the image and video pipelines actually accept.

### Fixed

- **Vision Provider with OpenRouter returned a 404.** OpenRouter needs vendor-prefixed model ids, and the vision path sent the bare id the settings carried. Bare ids of known families get their prefix automatically now, switching the vision provider prefills that provider's known-good default model instead of carrying the previous one along, and the model field shows a provider-aware example.
- **A text-only local model no longer silently becomes llava.** When the active Ollama model cannot see images, Skales now looks at which vision models are actually installed and uses one of those; with none installed it says exactly that, with the pull command, instead of failing with a confusing missing-model error. Detection also recognizes cloud-suffixed and differently-spelled tags of the multimodal families.
- **A #trigger routes to its API connector, deterministically.** Typing a connector trigger in chat now pins the turn to that connector instead of hoping the model picks it over web search or an MCP tool, a trigger saved with uppercase resolves too, and a connector whose docs yielded no endpoints says so in Settings instead of failing quietly.
- **The command highlight keeps its place.** When the colored command overlay appears mid-draft in a scrolled composer, it aligns to the text in the same frame instead of showing the caret on the wrong line, in the chat session and on the starting page.
- **The reasoning-effort tooltip is shorter.** The dial says what level is active without the click-to-cycle lecture.
- **The per-modality model pickers actually fetch now.** A key-handling fault made every fetch quietly fall back to a static text list, so the pickers looked empty. Fetching works now, the public catalog even loads without a key, and the pickers moved from a native browser datalist onto the app's own dropdown, loading their catalogs automatically when the panel opens.
- **PDF attachments work in the packaged app, not just in development.** Packaged builds shipped without the PDF text extractor, so every extraction failed silently while development worked fine. The packaged app now carries it.
- **Long generations are never cut off anymore.** The per-request timeout used to stay attached to a streaming response, so a model that was actively writing a large file for minutes was aborted mid-work with a timeout error. The timeout now only bounds the wait for a response to begin; once a model streams, only genuine silence on a dead connection ends a run, and the Stop button remains yours.
- **The Flow chat can be read while the agent works.** Auto-scroll only follows the newest message when the view is already at the bottom, instead of fighting an upward scroll.
- **Fixed-format compositions fit the preview.** A 1920x1080 motion graphic (or a 9:16 reel) scales to fit the pane instead of running off screen, and Motion gained format and duration controls that the composition and the renderer respect.
- **Flow projects stay out of the chat history.** Flow sessions no longer appear as regular chats in the sidebar, History or the command palette; they reopen from Flow's own project grid.
- **Small but annoying, fixed in Flow.** The code editor no longer collapses to a strip, a long model name no longer pushes Start to the next line, cloud-generated images and videos show real thumbnails in the project grid, the mode chip rail lost its stray dark box, and the Flow window in the desktop app wears the same hidden-inset chrome as the main window.
- **Flow works on a narrow screen.** Opened from a phone browser (Tailscale on the go), the workspace stacks chat above the live preview instead of hiding the preview, dropdown menus clamp to the viewport, and the template gallery wraps into rows. On desktop, the gallery breaks out of the column so no card is cut off and the hover lift is never clipped, and the mode chips shrink to fit one line.
- **Picking a template no longer types into your prompt.** A chosen template shows its brief as the placeholder (exactly what hovering previews) instead of inserting text that survived switching or clearing the template; with the box left empty, Start uses the template's brief as is.
- **LLM Profiles no longer flatten Flow designs.** Profiles keep weaker models precise while they operate tools, which is right for ordinary work but wrong for design: DeepSeek and MiniMax were composing Flow layouts in that precise mode, and the results came out flat and generic. Flow now keeps the model's full creative range while it designs; everything else stays precise.
- **Agent-written documents reach the Document panel again, proactively.** Documents the agent wrote were invisible to the panel, a fresh chat never told the model the panel existed, and weaker models wrote documents as plain chat text instead. All three fixed: ask for a summary, article or report in any new chat and it lands in the panel, opens rendered on a wide window, and lights the header dot on a narrow one.

## v12.0.0 - Solid

Two steps ahead. (This entry covers the work landed so far; the release is still in build.)

### Added

- **A format for role bundles.** Skales now has a defined format for a role bundle: one folder that carries the skills, connectors and slash-commands for a job role, with a loader that validates it before anything uses it. A bundle is only sound if every connector it ships is reachable through a skill or command, so a role arrives complete instead of as a connector with no skill that uses it. There is no install screen yet; this is the groundwork, with an example bundle in the developer kit.
- **Skales learns from your finished work, and the learning is yours.** When a goal hits friction and finds a way through, Skales keeps what worked as a short, reusable approach and notes what to avoid, so the next job of that kind starts ahead instead of from scratch. The approaches it leans on get sharper the more you work, since it favours the ones that actually reach a good result and quietly drops the ones that do not, and a quick "that's perfect" or "that was wrong" on a finished goal counts. The memory page shows each lesson with a quality mark, lets you pin the ones you rely on, and delete anything you do not want kept. It is a plain file on your computer that you own and can read.
- **Tell Skales to remember.** Say "remember this" or "from now on...", and it keeps that as a first-class note that surfaces first the next time it is relevant.
- **Skales stays a step ahead.** It surfaces a meeting that is about to start or a scheduled task that did not run, quietly prepares for a meeting that has an agenda before you ask, and gathers everything else into one calm daily briefing instead of a stream of pings. The memory page shows what it got ahead of and why, and you can mute it in notification settings.
- **Skales names your chats for you.** A new conversation gets a short, specific title drawn from its first exchange, the way you would name it yourself, instead of the first line of your message. The placeholder appears at once and is replaced when the title is ready.
- **Show an image you already have.** Skales can display an existing image file from your workspace right in the chat, so a picture you or a connected service saved appears inline instead of being described or pasted as raw data.
- **A dot shows when a document is waiting.** The document button in the chat header now carries a small mark whenever the current chat has a document but the panel is closed, so an artifact Skales wrote, or one in a chat you reopened, is easy to find instead of hidden behind a closed panel.
- **Delete your Skales IQ trial data yourself.** A new control in Settings, under Skales IQ, removes your trial record from our server and switches off its key in one click. The signup now also says plainly why your email is kept, to prevent abuse and to offer you a later upgrade or credit, and that you can remove it whenever you want.
- **Codework templates are back in the library.** The Templates page has a Codework category again, with ready-made coding tasks, fixing a bug, writing a test suite, refactoring, scaffolding an API endpoint and more, that open straight in Codework with the task already filled in.
- **Find your real models, not a fixed list.** The model switcher now shows the models you actually have. Your favourites and recently used sit at the top, and a search field finds any model across every provider you use, your real OpenRouter, Gemini, Anthropic and Ollama models, instead of a short hardcoded lineup. A star keeps any model one tap away, the same in the in-chat switcher and on the new-chat screen, and a local model server that is not running drops out instead of listing dead entries.
- **Pick who answers and which model before you start.** The new-chat screen has its own row under the box for the agent and the model. Choosing an agent fills in its model for you, and you can switch to any other model just for this chat without changing your default. The choice sticks to that conversation and is still there when you reopen it, and a later switch inside the chat sticks too.
- **A new in-between coding mode for Chat.** Between Code, which asks before each edit, and Auto, which works on its own, there is now an Edits mode: it approves your file edits as it goes but still asks first before a shell command, a git push or a deploy. Pick it from the same Chat, Code, Plan, Auto strip.
- **Plan mode hands you the plan to approve.** A folder-bound chat in Plan mode now writes out its finished plan and waits for you to approve it before anything runs, instead of switching to Code and starting on its own. You read the exact plan, then approve to build it.
- **Choose how much Codework may touch.** A new file-access setting runs a project read-only, lets it edit, or lets it edit but never delete. Deleting a file always needs an explicit yes, whatever the setting.
- **Chat reads your project's own rules.** A folder-bound chat in a coding mode now reads an AGENTS.md (or CLAUDE.md) at the folder root and follows it, so your project's style, test runner and conventions carry into every reply without you repeating them.
- **Codework remembers your project across runs.** Before it starts, Codework reads an AGENTS.md (or CLAUDE.md), memories.md or branding.md at the project root and follows it, so its work keeps to your conventions and tone every time instead of relearning them.
- **Codework tells you when it is done.** A finished or interrupted Codework task now raises the same toast, chime and sidebar mark as a chat, so a task you left running reaches you even when you are on another page.
- **Your activity recap covers the tools you actually reach for.** Using an MCP tool or a Hugging Face Space, creating a template, and exporting any Studio video (not only a text animation) now register in your Discover activity and your weekly Wrapped, instead of going unrecorded. Wrapped also keeps the model you leaned on most for the week and tells your Chat, Code, Plan and Auto time apart.
- **A home you choose: Calm or Power.** The dashboard opens in one of two layouts and remembers which one you picked, so it looks the same the next time you open it. Calm keeps it personal: pick up where you left off, jump back into recent chats, what Skales has on its mind, your most active surfaces, and quick ways to start. Power is for getting work done: your active goals with their real progress, Autopilot status with this hour's API calls and anything waiting on your approval, your provider balance, your connections and paired devices, and live runtime memory, CPU and uptime. Your own avatar emoji greets you, the current weather sits under the greeting, and your weekly Wrapped badge rides in the header with a tap straight to the recap.
- **Your briefing, in a single line under the greeting.** When you have joined a Briefing in Discover, its latest items rotate through one calm row and open in the built-in browser on click. When you have not joined yet, that same row invites you to, so the home screen is where a briefing begins.
- **A balance you can trust, or nothing at all.** Running on Skales IQ or OpenRouter, the Power view shows your real remaining balance with a gauge. Skales IQ shows the percentage of your trial left, exactly like the Settings box; OpenRouter shows your remaining credit in dollars. For a subscription or a key that exposes no balance, the card simply does not appear, rather than inventing a percentage.
- **Your week, at the top of the home screen.** A seven-day strip under the greeting lays out the current week, with the events and planner tasks for each day, and today marked. Empty days stay empty rather than guessing. It is there in both Calm and Power, and any day opens the Planner.
- **Pick up where you left off, in both views.** The one-click way back to your last session now sits at the top of Power too, not just Calm, so getting back to work never means hunting through History.
- **Real runtime health, measured not guessed.** The Power view reads the backend's actual memory, CPU and uptime live and labels them as the runtime's own, instead of the browser-heap placeholder the old system tile showed. Nothing on the home screen is a stand-in number.
- **Home widgets that all show real data.** The optional-widget strip gains your latest Studio work, your running goals, the next scheduled goal, your latest Briefing items, your Wrapped badge, your online team devices, and your most-used surfaces. The empty Quick Chat box, the duplicate memory cloud, the buddy-mood tile and the placeholder system tile are gone.
- **Choose how deeply the model thinks, per chat.** A small dial next to the message box steps through four levels of reasoning effort, and its circle fills and shifts colour as you go up: an empty yellow-green ring for the lightest, then half blue, a full orange, and a full red for the deepest. The dial follows the model you have picked. On models with a real reasoning control, Claude Sonnet 5 and the newer Opus, and reasoning-capable models through OpenRouter, it drives that control directly. On models that have none, your local models, custom endpoints and most direct providers, it shows a muted "none" ring and steps aside, so it never claims a depth the model cannot deliver and the message box never shifts when you switch models. The level stays with that conversation, and the dial is on the new-chat screen too, so a level you pick before the first message rides into the session. Once you raise it, it takes over from the global deep-reasoning switch for that chat; a fresh chat, or the dial back at its lightest, follows your global setting.
- **Claude Sonnet 5 is ready to use.** Sonnet 5 is in the Anthropic model list and runs with its adaptive thinking on by default, with its output length and long-conversation compaction sized for it, so a long answer no longer cuts off early.

### Changed

- **Trivial turns feel instant.** A greeting, a thanks or a quick "ok" skips the heavy setup a real task needs and answers right away, with no thinking card sitting above a one-word reply.
- **Deep reasoning reaches more of your work, and stops wasting itself.** With the xhigh deep-reasoning boost turned on, a Codework run now plans as carefully as a chat or a goal already did, so a coding job gets the same care. And a greeting or a quick thanks no longer triggers a full reasoning pass, so those pleasantries stay instant.
- **The reply box frees up the moment your answer lands**, instead of waiting on background bookkeeping, so you can keep typing without a pause.
- **A tidier message box.** The magnifying-glass and slash buttons are gone from the message box. Both only opened things you already reach by typing "/", which lists every command as you type, so the reasoning-effort dial takes the slash button's old spot. The small labels on the message-box buttons now appear the instant you hover instead of after a pause.
- **A document Skales writes opens ready to read.** It opens rendered, the finished look, instead of as raw markdown; switch to the editor when you want to change it.
- **It feels like a native app, not a web page.** The pointer is the system arrow over buttons and links instead of the web hand, and every dropdown is a real, keyboard-friendly menu that matches Skales rather than the raw operating-system control.
- **Clearer empty and error screens.** When a list has nothing in it yet or something fails to load, Skales shows a short explanation and a way forward, like try again, adjust filters or start a chat, instead of a bare spinner or a raw error line.
- **Every tile on the home screen goes somewhere.** Each card, stat and list on the dashboard now opens the thing it stands for, a chat, a goal, a memory, a setting, the schedule, the briefing, instead of sitting there as text. The old capability grid that led nowhere is gone.
- **Your recap counts the work you do outside chat too.** Finishing a Codework project, running an Organization, holding a Group Chat, running a custom skill, and rendering a Studio video now register in your weekly Wrapped and the dashboard's most-active card, the same way in-chat work already did, so the picture of how you use Skales is no longer chat-only.
- **A cleaner, more human voice.** Replies avoid em-dashes and marketing filler, both in how Skales is guided and in a final pass over the answer.
- **A smaller, faster download on Mac and Linux.** The installer no longer carries build tooling it never runs, so it is meaningfully smaller and updates arrive faster.
- **Background and team work runs leaner.** Unattended tasks, agents and team plans load only the tools a step needs instead of the whole set.
- **The free trial no longer ties itself to usage analytics.** When you start Skales IQ, anonymous usage statistics stay on by default to help improve the product, but onboarding now has a clear switch to turn them off on the spot, and the trial starts either way. Choosing not to share them never blocks or changes your trial.
- **The native, consistent look now reaches the rest of the app.** Settings, Chat, the sidebar and History share the same rounded cards and inputs, snappier motion that only animates what should move, the last raw dropdowns replaced by the same keyboard-friendly menu, and disabled controls that dim again, so the whole app feels of a piece. History's provider and channel filters sit on one tidy row with the refresh beside the conversation count, and the sidebar's bottom bar reads more calmly.
- **The new-chat screen has more to say.** It opens with a wider, rotating set of lines, including a few meant to make you smile, instead of the same handful, and the input keeps a little breathing room when you focus it.
- **Codework asks before writing by default.** New file writes wait for your approval until you say otherwise; turn auto-approve back on in the approval panel whenever you want the faster flow.
- **Full disk access takes a deliberate second step.** The full-disk option in the Code access prompt now says plainly that it applies to every chat and stays on until you change it in Settings, and asks you to confirm once more, so a single tap can no longer open your whole disk everywhere. Granting just the one folder stays one tap and is the recommended choice.
- **Codework follows the same folder-safety rules as the rest of Skales.** It uses the shared protected-paths list and re-checks the real location of a file before writing, so a project that tries to reach outside its own folder through a link is stopped.
- **Codework works to your full step budget, not a fixed limit.** A run now follows your goal step-budget setting all the way (0 means run to completion, like a goal) instead of a hardcoded ceiling, so a real autonomous job is no longer cut short after a handful of steps; a stuck model is still stopped early by the progress guardrails.
- **Codework's autonomy settings moved out of the header and onto the start screen.** You now set auto-approve, file access, preview and the test command before a run, on the start screen, the way a coding agent should. During a run the gear opens those same settings as a clean centered panel that matches the rest of Skales, instead of a strip wedged into the header that could sit on top of a pending approval.
- **Codework's approval looks like the one you know from chat, sits where you are working, and waits for you.** A pending action now shows as the same clear approval card you see in chat, with Approve, Deny and Always approve this session. It is pinned to the bottom over the terminal, not jammed into the header, so the step it is asking about stays readable above it. "Always approve this session" now actually gives the run a free pass, so the rest of the run stops asking instead of prompting again on the next command. And it is patient: the approval waits 30 minutes instead of 5 and a run may take up to an hour, so pausing to read it or opening settings no longer aborts the task with a timeout.
- **Codework reads and searches your files through the same engine as the rest of Skales.** Reading a file and searching the project in a Codework run now go through the shared tool path that Chat uses, so an improvement or fix to it reaches both at once and there is one set of file-safety rules to trust. Writing files, running commands, the file tree, diffs, the write preview and undo are unchanged, and a run still works only inside the folder you chose.
- **Auto pauses before it reaches outside the work.** In Auto mode, an action that pushes to a remote, deploys, runs a destructive command, or writes outside the folder you bound now stops for a single approval instead of going through unattended. Ordinary edits and commands inside the folder still run without asking, so Auto stays fast where it is safe and checks in only where the stakes are higher.
- **Codework shows an accurate diff, and you can open any file to read it.** The change view now lines up moved code correctly instead of marking every line after an inserted one as both removed and added, so a real edit reads cleanly. Clicking a file in the tree opens it in a read-only viewer, so you can check the code on the right without leaving the page. It stays a viewer, not an editor: Codework works by doing, not by hand-editing.
- **A coding chat gets the same project map as Codework.** The structural index of your project now uses the same, larger budget in Chat as in Codework, instead of a tighter chat-only cap, so on a big codebase the model starts with more of the picture. When the map is still too large to fit, it says so and points the model at the rest to open on demand, rather than quietly handing over a partial map.
- **A mistyped file mention tells you, instead of failing quietly.** In a coding chat, when you mention a file with @ that is not in the bound folder, Skales now says it was not attached, so a typo no longer looks like it was simply ignored. A bare word that is not a path, like a skill mention, is left alone.
- **Safe commands stop asking, risky ones get a clearer prompt.** A short list of read-only and test commands, like npm test, git status and listing files, now runs without a confirmation, so a command you repeat all day stops nagging. This skips the prompt only inside a folder-bound coding session (Code, Edits or Auto on a folder you chose); a plain chat still confirms every command. Installing packages or pushing to a remote now asks with a message that says what it does, instead of a blanket "Run command?". A force-push that rewrites remote history, or a download piped straight into a shell, is refused outright with an explanation. The block on system-wrecking commands is unchanged and still cannot be turned off.
- **Commands Skales runs no longer see your secrets.** When Codework or a coding chat runs a shell command, the command now runs with API keys, tokens and Skales' own internal values stripped from its environment, so a script in a project you are working in cannot read them straight out of memory and send them away. The command still runs only in the folder you chose, and new file writes still ask first unless you turn that off.
- **A folder-bound run cannot read outside its folder through a link.** When a coding run reads a file in the folder you chose, it now checks the file's real location, so a link inside the project that points somewhere else can no longer be used to read a file outside the folder. The write side already did this; the read side now matches.
- **Codework reads several files at once.** When Codework decides to read or search more than one file in a single step, it now does that reading in parallel, up to four at a time, instead of one after another, so the part where it gathers context to understand your code is quicker. Writing files, running commands and everything else stay one step at a time, in order. A step that mixes a read with a write or a command runs sequentially too, so a read never returns content from before a write in that same step.
- **Your most-used tools live in the main menu now.** Workflow, Planner, Tasks and Wrapped moved up from Tools into the main sidebar, Discover sits right under History, and Codework moved into Tools, so the surfaces you reach for every day are one click away. The order is the same in every theme, and anything you have switched off in Add-Ons still stays out of the sidebar.
- **Features that have settled no longer wear a Beta tag.** Teams, LLM Profiles, Agent Swarm, the Always-On Agent, Call Mode and memory Dreaming have been steady for a while, so their Beta labels are gone, in every language. The genuinely early ones, like the Skales IQ trial and the Business preview, still say so.
- **The home screen fills in faster.** The dashboard now runs its status checks together instead of one after another, holds the weather and your goal and memory lists for a few seconds, and no longer scans the same files twice on a single open, so it settles quicker without going stale, and a memory you delete still disappears at once.
- **The update screen puts its links last.** The social links now sit at the very bottom of the update page, below the updater's own log, so the log is easier to reach.

### Fixed

- **A connected tool cannot smuggle hidden instructions into Skales.** A tool from an MCP server is third-party, and its description is shown to the model, so a malicious or careless server could hide commands in invisible or control characters inside that text. Skales now strips those characters from every MCP tool description and caps its length, so a connected tool cannot quietly steer the model through text you never see.
- **One misbehaving MCP tool no longer breaks the rest.** A tool that reports a malformed input schema is now coerced to a safe shape instead of breaking the model's tool-calling for the whole message, so a single bad server can no longer take the others down with it.
- **Skales works with MCP servers on the newer protocol.** It now remembers the protocol version a server agrees on and sends it back on every later request, the way the current spec requires, so a stricter or newer server no longer rejects Skales' calls after connecting.
- **The balance card shows a number you can place.** On OpenRouter the home screen now shows only your real remaining credit, without the confusing lifetime-total figure and gauge beside it that did not map to any budget you set.
- **A stopped background engine comes back on its own.** If the Skales server stops while the app is open, for example because its background helper was force-quit (a common way to close Skales on Windows, where shutting the window only hides it to the tray), Skales now quietly restarts it and reloads you right where you were, instead of a red "stopped unexpectedly" box. A calm restart prompt appears only if the engine cannot stay running after several tries.
- **On Windows, selecting Ollama no longer freezes the app or flashes a console window.** If Ollama is not installed Skales says so at once instead of opening a stray window and hanging for ten seconds on every check; when it is installed it starts quietly with no window.
- **A model that got stuck loading its tools now just works.** Some models would keep announcing that a tool is "available next step" instead of using it; Skales now hands those models every tool directly and adds a switch under Settings, Advanced to turn on-demand tool loading off if you ever run into it.
- **The memory page reads cleanly again.** The nightly Dreaming summary and the knowledge-graph line showed a placeholder instead of the real count, and Dreaming could list raw bits of page data as if they were facts. The counts now read normally, only real sentences are kept as memories, and any old stray fragments stop showing.
- **Studio templates fill themselves in.** Picking a template for Skales Studio now opens it with the prompt already in place on the right tab, instead of an empty screen.
- **What you set about yourself stays yours.** The emoji, occupation and goals you enter on the Memory page no longer get overwritten when Skales does its background tidy-up of what it knows about you. The cleanup used to let its model rewrite those user-set fields with its own guesses; now your own answers are kept every time, while a field you left blank stays open for Skales to fill in as it learns. Only the AI summary is meant to update on its own.
- **Plan mode is genuinely read-only.** It used to let a writing connector or an external tool slip through because they were judged only by their name; Plan now reads what the tool would actually do, so a chat set to Plan investigates and proposes but changes nothing until you switch to Code.
- **Codework approvals are steadier.** A pending approval or a proposed change is now also saved to disk so it is easier to keep track of in the background, and a stale internal reference that could send a tool down the wrong path was removed.
- **A long chat that becomes a goal now proves it is finished.** When a long task quietly turns into an autonomous goal, Skales works out what "done" means for it and checks against that before saying it is finished, instead of taking the model's word, so a weaker model can no longer stop a converted task early.
- **Codework re-checks the project folder before it reads anything.** The folder you point Codework at is now validated on the server as well, not only in the window, so a run always works inside a vetted, writable, non-system folder before any file is read.
- **Plan mode catches more external write tools.** A connected tool whose name mixes a read word with a write one, like a "query and delete" tool, is now held back in Plan mode instead of slipping through on the read word, so a read-only investigation stays read-only.
- **Wrapped reports an honest "most-used tool".** Studio, Organization, Playbooks, Templates and MCP activity used to fall into the Chat bucket, which inflated Chat and hid those tools; each is counted on its own now. A busy week is no longer trimmed early either, so the activity total reflects everything you did instead of stopping at an old internal limit.
- **A shell command cannot slip a second action past the safety check.** A safe command that runs without asking in a coding session can no longer carry a riskier one hidden on a new line, and Auto mode now pauses for a single approval on a destructive command however its flags are spaced or spelled, and on a command that writes to a file outside the folder you bound. A force-push that rewrites remote history is still refused unless you have deliberately set safety to Unrestricted.
- **A coding run stays inside its folder when it reads, not only when it writes.** A file reached through a link, or through a path that points up and out of the project, is no longer read from outside the folder you chose, so the read side now matches the protection the write side already had.
- **The commands Skales runs never see your secrets, including the ones it runs for itself.** The internal version, status and search commands now also run with your API keys, tokens and Skales' own values stripped from their environment, and a few more credential shapes (a database URL, a webhook) are recognised and removed.
- **A long chat that becomes a goal finishes in one go again.** A task that quietly turned into a goal at the step cap could get stuck asking you to keep going instead of completing on a clear, finished answer. It now completes unless a real check actually finds something unfinished.
- **Your daily briefing still reaches you when the first look of the day was quiet.** If nothing was waiting at the first morning check, the day stays open so anything that comes up later still arrives in one calm briefing, instead of the slot being spent on an empty one.
- **One reminder for a meeting, not two.** With a check-in style turned on, a meeting about to start no longer pings you twice from two different places.
- **Skales keeps only what you meant to teach it.** A one-off request phrased like an instruction ("from now on, can you...") is no longer stored as a permanent rule, and pinning or deleting a saved lesson on the memory page can no longer collide with the background learning and lose your change.
- **A new chat is never named "No response", and a real title is kept.** A title that happens to begin with "We", "I" or "The" is no longer mistaken for leaked reasoning and dropped, while an empty or thinking-only reply no longer becomes the chat's name.
- **Every most-used surface on the home screen opens its own page.** A row for Codework, Studio, Organization, Playbooks or Templates now opens that surface instead of always opening Chat.
- **Premium replies stay quick across a long session.** Replies from Claude reuse the stable part of the prompt from one turn to the next again, so a long conversation does not slow down as it grows.
- **Role bundles load safely.** An empty or malformed bundle file no longer stops the rest of a bundle from loading, and a connector named with a scope or a symbol is recognised correctly.
- **The dark and light mode control is labelled correctly** again, instead of reading "Appearance".
- **Typing a command in a long message keeps the cursor where you are.** When your draft held a /command or an @mention and grew tall enough to scroll, the box could stop following your cursor and drop your taps in the wrong spot, so you could not fix a word. The box now scrolls with you and the highlighted text lines up with the caret, so a long message edits normally.

## v11.6.0 - Bedrock

A deep reliability pass across everything Skales does. Tools now do the work they claim and tell you the truth the moment something fails, instead of reporting a confident "done" that quietly did nothing. This is the solid engine the next release builds its new look and feel on.

### Fixed

- **Tools tell you the truth about whether they worked.** Across messaging, calendar, WordPress, Notion, YouTube, smart home and more, an action that failed, was not configured, or only partly succeeded used to come back as a cheerful success. Skales now checks the real result and reports an honest failure with the reason, so you find out the moment it happens instead of discovering later that nothing was sent, saved or posted.
- **Messages reach the right person, every time.** WhatsApp now matches a contact exactly and asks rather than guessing, so a message never goes to the wrong person from a partial name or number. Telegram only reports "sent" when the send truly went through. Long Discord messages are split into parts instead of being silently cut off. Twitter mentions and your timeline show up again, and Signal correctly reports a failed delivery instead of claiming success.
- **Email is safer.** A reply now goes through the same trusted-address check as a new email, finds the original message in any folder, and uses the right account. Deleting one email removes only that message instead of risking a sweep of others in the mailbox.
- **Reminders and scheduled goals are dependable.** A reminder set for later no longer fires the instant you create it, and a reminder whose delivery hits an error is retried instead of being marked done and lost. A scheduled goal whose previous run crashed now recovers and runs, instead of skipping itself forever. An empty or malformed schedule is refused instead of creating a job that does nothing.
- **Long tasks and big projects finish.** A goal that writes many files no longer stops partway at a hidden limit. When a step is cut off by length, the parts that were valid still run and the rest is retried, instead of the whole step being dropped or run with empty content. A tool waiting for your approval is no longer mistaken for a failure that aborts the task.
- **Goals run autonomously to completion instead of asking you to babysit.** A goal now works the whole task through on its own and stops only when it is done, when it genuinely needs your input, or before a consequential action like sending an email or deploying, where it still asks once (with a one-tap "always allow" on the card). It no longer pauses every dozen steps for a "Continue?" card. A plain chat that grows into a real multi-step task is carried on as a goal automatically and finishes in one go, instead of stopping partway with a "parked as a goal, continue?" card. And a goal that did reach its limit now picks itself back up while you are away, so it keeps moving without you. The step limit in Settings > Goals is now a safety ceiling against a runaway task, not a check-in cadence, set high enough that normal work never reaches it; 0 means run to completion.
- **Replies do not freeze, and thinking models finish their answer.** If a provider sends the end of an answer and then holds the line open, Skales keeps the finished answer instead of throwing it away. Reasoning models are given the time they need before Skales decides a reply has stalled.
- **Claude and Gemini type their answers out as they go.** Replies from Anthropic (Claude) and Google (Gemini) now stream in word by word as they are written, the same as every other provider, instead of sitting on a blank screen until the entire answer (and any thinking) is finished. The two premium providers were the only ones that made you wait for the whole thing, so this is where the wait for the first word was longest.
- **The same behaviour across every AI provider.** Tool use, sending an image by file, parallel tool calls and reasoning-model requests now work consistently whether you run Gemini, an OpenRouter model, Kimi, DeepSeek, Anthropic or a local model, instead of one provider quietly behaving differently. A tool action requested over WhatsApp or Telegram now runs reliably instead of stalling the reply.
- **Your files stay inside your workspace.** Editing, moving and copying a file now resolve relative paths inside your workspace instead of escaping to the install folder, binary files are no longer read as text, and a saved session can no longer be opened through a crafted path.
- **Web access is safer and actually returns the page.** Built-in web fetching is routed through the same protection that blocks internal and local-network addresses, and a fetched page returns its real content to the model instead of only a character count.
- **Media gets delivered.** A generated image arrives on Telegram instead of a broken reference, a video scene actually renders into the result, a voice clip is returned even when Telegram is not connected, casting a link with special characters works, and a browser playbook reports a failed step instead of marking everything done.
- **Connected services hold up.** Google Drive and Docs refresh their sign-in automatically instead of breaking after about an hour, Notion reports a real failure on invalid input, Home Assistant validates a command and confirms the change actually happened, and a custom capability you add survives the next rebuild instead of being wiped.
- **Your memory and goals do not get corrupted.** The knowledge graph and goal schedules are written safely, so a crash or two changes at once can no longer empty or scramble them, and a partly-failed update is reported as exactly that.
- **Skills are honest about themselves.** Creating a skill now verifies it actually loads before claiming success, deleting one matches it safely, and the built-in documentation opens correctly in the packaged app.
- **Your message always shows, even when you send the same thing twice.** Sending an identical message again no longer makes its bubble disappear from the chat after the reply arrives.
- **The chat is ready the instant the answer lands.** The message box re-enables as soon as the reply is saved instead of waiting on background bookkeeping, and a long conversation stays smooth to type in, so you can keep going without a pause.

### Changed

- **Skales IQ, the free built-in trial, is more private and more reliable.** Every trial request now enforces zero data retention at the provider, the trial no longer garbles ordinary words like "Google" in its answers, and its daily limit survives a server restart. Activating the trial no longer turns on usage analytics on its own.
- **Approvals reach you wherever you are, and the task finishes after you approve.** A sensitive action started from your phone now asks for your approval and waits for it, then carries on with the rest of the task once you approve, instead of stopping at the approved step and dropping whatever came next. Writing or skill-authoring actions are held back in read-only Plan mode and ask first over WhatsApp.
- **Simple turns stay snappy.** A greeting, a thanks or a quick "ok" gets a fast, light reply, and one earlier hiccup no longer makes the rest of the conversation heavier.
- **More connected integrations without the slowdown.** Having many MCP servers, custom skills or Hugging Face Spaces enabled no longer weighs down every message, so you can keep more of them switched on at once without each turn getting heavier. Disabling an integration still removes it entirely.

## v11.4.62 - Polyglot

### Fixed

- **The gecko shows on the startup screen again, even on a large profile.** On a machine with a lot of saved chats and data, the little gecko on the loading screen could come up blank while everything loaded. The startup and error screens now carry the gecko with them instead of fetching it, so it always appears right away.
- **Kimi models run their tools again, and stop leaking their thinking into the chat.** On Kimi (Moonshot) K2 models, including the thinking variant, a tool the model wanted to use was sometimes written into the reply as raw internal markup instead of being run, so nothing happened and the markup showed up in the chat. Skales now recognizes that format, runs the tool, and keeps the visible answer clean.

## v11.4.61 - Hotfix

### Fixed

- **Long tasks no longer freeze when a model goes quiet mid-reply.** If a provider stops sending partway through an answer, Skales now notices within seconds, starts the reply over and switches to another provider if one is set up, instead of sitting frozen for minutes. A task that stalled this way keeps going on its own.
- **Big files stop spinning and finish.** When a single file was too large to write in one step, a task could keep retrying the same oversized write and use up its whole budget without finishing. It now writes the file in parts and, if a model still cannot, stops with a clear message instead of looping. The same fix applies to the desktop Buddy.
- **A thinking model gets enough room to finish its answer.** Reasoning models are no longer squeezed down to a tiny reply size, so they finish the answer instead of thinking and then going silent.
- **An action cut short by the output limit is retried the right way.** Actions other than writing a file, like updating a task list, are no longer pushed into writing a file by mistake when they get cut off; they are simply tried again more compactly.

## v11.4.60 - Scenes & No Cap

### Added

- **Scenes: a real multi-scene video editor in Studio.** Describe a video and get a scene-by-scene plan, then edit and regenerate each scene, pick a visual style, reorder scenes and drop your own image into any of them. Watch a live preview of a single scene or play the whole sequence with transitions before you render anything, then export it all to an MP4. Reopen a recent project any time to pick up exactly where you left off. Find it in Skales Studio under Scenes.
- **A real visual style for your images and animations.** Skales Visuals now has a style picker (premium dark, editorial, minimal, vibrant, retro, brutalist and more) that actually shapes the result, for both image and video.
- **Edit a visual right in chat.** After an image or video, a Refine line lets you ask for a change and the visual updates in place instead of starting over.
- **Send an image on WhatsApp and act on it.** An image you send Skales on WhatsApp is now saved to its workspace, not only described, so you can follow up on the go with things like edit this image or turn it into a video using your tools or a connected service.
- **Steer how images are read.** An optional extra instruction in the Vision Provider settings is added to every image description (for example read all on-screen text verbatim, or describe charts as data tables), which matters when your chat model has no vision and only sees the description.
- **Write very long files in parts.** A file too large to produce in one step can now be built up piece by piece, so large code files, full pages and long documents are written reliably instead of being cut short.

### Changed

- **Image and video each get their own direction.** Posters are composed as still graphics and animations as motion, and both now follow the colours, fonts and style you actually asked for instead of a fixed look.
- **Capable models use more of their output.** Models that can write more are no longer held to a small size, so longer answers and files come through in one go when they fit.
- **Visuals can use motion and 3D, not just flat effects.** Generated images and videos across Studio and chat can now reach for real animation and 3D depth, so results look closer to hand-crafted design instead of a flat template.

### Fixed

- **Big single-file builds finish instead of stalling.** When a task asked for one large file, it could be cut off partway and the run would get stuck retrying. It now completes the file and the task, across more models.
- **Attaching an image no longer shortens the reply.** A photo or screenshot in chat could cause the answer to be cut short; it now comes through in full.
- **Your Brand Kit logo shows up in visuals.** With Brand Kit on, your logo is placed in the generated visual instead of leaving a blank.
- **Image reading fails honestly.** When a configured Vision Provider cannot read an image, Skales now says so and points you at the settings, instead of quietly passing the error on as if it were the picture.
- **Planning no longer fails over how a model formats its answer.** Scene planning and other AI steps used to break when a model added a note or extra text around its answer; they now read the result cleanly across more models.

## v11.4.51 - Duet

### Added

- **Take over a team task as its own chat.** From a shared team plan you can open a task assigned to you as its own chat that carries the plan's context, while the shared plan stays in Teams. A task you take on becomes a real conversation in your History, and nothing is lost on either side.
- **Read PDF, Word and Excel files in chat.** Point Skales at a .pdf, .docx, or .xlsx and it reads the text out, so you can ask questions about a real document, not just plain-text files.

### Changed

- **Faster to start when you have a long history.** Skales no longer re-reads your entire chat history every time it launches, so opening it stays quick even after months of conversations.

### Fixed

- **ChatGPT subscription works for real work, not just replies.** Signed in with a ChatGPT subscription, Skales now uses it for tool use and agent tasks too, lets you pick the model from a list you can edit, and shows as connected once you are signed in.
- **Reading a past chat no longer reorders your History.** Opening a conversation just to read it keeps it where it was; only sending a new message moves it to the top.
- **Short answers in chat finish cleanly.** A brief reply no longer leaves a chat looking unfinished.

## v11.4.50 - Connect

### Added

- **Connect MCP servers that need a sign-in, not just an API key.** Remote MCP servers that authorize through your account (for example Higgsfield) now work: add the server, click Sign in, approve in your browser, and its tools come online. Pick Higgsfield from the quick-setup list to add it in one step. Skales keeps you signed in and renews access on its own, and Sign out is one click on the server row.

### Changed

- **A skill you edit takes effect right away.** When you change one of your own skills, the next time it runs it uses the updated version instead of the old one until a restart.
- **Steadier through an unexpected restart.** Skales records its background state more carefully, so an unexpected restart no longer resets your hourly usage limit or drops recent activity.

### Fixed

- **A long-running scheduled or background task no longer runs twice.** When a background task took longer than its time limit, the old run could keep going while a retry started alongside it, which risked repeating an action like sending the same message twice. The run is now stopped before the retry begins.
- **You are told when the Telegram bot gives up.** If the bot fails to start over and over and Skales stops retrying to avoid a loop, you now get a heads-up to reconnect it instead of it going quiet.

## v11.4.25 - Steady

### Fixed

- **Google Gemini works in chat again.** Chats on a Gemini model reply reliably, tools included. Image generation was unaffected.
- **The aspect ratio you choose is applied.** Picking 1:1, 9:16, or 4:5 produces an image in that shape, in Studio and in chat.
- **Chat stays reliable.** Resolved a case where chat could stop responding and now keeps going on its own.
- **First-time setup always runs on a new install.** The welcome flow is no longer skipped the first time you open Skales.

## v11.4.24 - Handshake

### Added

- **Generate images and video from the chat composer, now with fal.ai.** The generation toolbar (the Sparkles button above the message box) offers fal.ai alongside Skales Visuals, Google, and Replicate, for both images and video: Flux, Recraft, and Ideogram for images, LTX-2.3 for video. A custom-model field lets you point a provider at any model id, so a newer model works without waiting for an app update.

- **API Connector: connect any REST API from its own docs.** A new tab (Settings > API Connector) turns an API's documentation, or an OpenAPI spec, into a connector the assistant can call. Paste the docs or a docs URL, press Generate, review the endpoints, confirm the target domain, and add your key. The key is stored encrypted on your machine and is only ever sent to that API's own host, never to the model. Trigger a connector in chat with #name, for example #sevdesk. A read runs right away; anything that writes asks you to confirm first. Chat-style LLM APIs are detected and pointed to the AI Provider settings instead.

### Fixed

- **Asking Skales to generate an image works again in chat, WhatsApp, and Telegram.** When a Google API key was set but its image quota was empty, the request failed instead of trying another provider. Image generation now falls back across the configured providers, so a plain request like "generate an image of ..." produces an image whenever any image provider (Google, Replicate, or fal.ai) is set up.

- **Team pairing now connects both computers, not just one.** When you entered the code on the second computer and pressed Connect, it stayed on "connecting" while the first computer opened the chat. The computer that enters the code now confirms automatically, since typing the code and pressing Connect is already the intent, while the computer that shows the code still confirms the incoming peer once. Both sides land in the conversation. The two also exchange their hello reliably no matter which joined first, so connecting no longer depends on timing.
- **The pairing confirmation is no longer hidden behind the code window.** On the joining computer, any confirmation now appears inside the pairing window instead of behind it.

## v11.4.23 - Follow Through

### Added

- **Paste an image into the starting chat box.** The opening composer now accepts a pasted image the same way the in-chat composer already does. Uploading and dragging an image in already worked there; pasting now does too.

### Changed

- **The tuning profiles for reasoning models tell them to act in the same turn.** The built-in profiles for Kimi, DeepSeek, GLM, MiniMax, Qwen and Skales IQ now carry an explicit line: when the model says it is about to use a tool, make the call in that same message instead of posting a "let me..." line and stopping. This reinforces the first-reply fix below at the model-tuning layer, and the same update goes out to the community profile library so it reaches imported profiles too.
- **Profiled models share a common voice across every channel.** On top of the per-model tuning, the profiles now tell the model to answer like a colleague: no filler or thanks-for-reaching-out, own a mistake in one line instead of apologizing in a loop, never claim it has no real-time data (use web search), and check the context before asking a question. These correct common habits of weaker models and apply wherever a profile is active, which is chat, Friend Mode, Telegram, WhatsApp, the Buddy and now Autopilot's reports and plans too. Strong frontier models match no profile and are unchanged.

### Fixed

- **The assistant acts on its first reply instead of stalling.** Some models would open by saying what they were about to do, like "let me pull up your notes", without actually calling the tool, and the turn ended there, so you had to tell it to continue. It now follows through and runs the tool in the same turn.
- **The Vision Provider's per-surface switches take effect.** The Chat, Telegram and WhatsApp switches under Settings, Vision Provider were not being read, so a configured Vision Provider read every image on every surface regardless. They now work. They stay on by default, so an existing setup keeps reading images exactly as before; turning one off sends images on that surface straight to your model instead of through the Vision Provider, which is what a vision-capable model wants.

## v11.4.22 - Real Work

### Changed

- Scheduled tasks, planner tasks, and autonomous tasks now run as deep as a goal instead of stopping after a handful of steps. They follow your Goal step budget (default 80, or 0 to run to completion) and the per-task time limit, so a scheduled job that does real multi-step work actually finishes rather than reporting done half-way.
- Multi-agent subtasks run deeper so each agent completes its part.
- Tasks sent from Telegram, WhatsApp, the desktop Buddy, and the CLI get a real working budget: about 40 steps on a normal model and up to 80 on a strong cloud model. The Buddy now scales with the model like the channels do.
- The WordPress and in-page Browser agents run more steps for multi-page work, and the per-turn tool-call ceiling is higher so a run that touches many files at once is not cut short.
- Raised the autonomous hourly call budget so the deeper task runs are actually reachable.

## v11.4.21 - Overall Improvement

### Added

- **LLM Profiles keep themselves current.** The per-model tuning library now refreshes from the community repo on its own, about twice a day, so a newly released model is tuned the moment a profile is published, with no Skales update to wait for. Your own imported profiles are never touched, and it does nothing if you have LLM Profiles switched off.

### Changed

- **Google (Gemini) requests send your API key as a header.** The key now travels in the standard `x-goog-api-key` header instead of inside the request URL, across chat, image and video generation, model listing, vision and everything else that talks to Google. It keeps your key out of any URL logs and lines up with Google's current key handling. Subscription-token (BYO) sign-ins are unchanged.
- **Studio leads with current image and video models.** The video picker now offers Veo 3.1, Veo 3.1 Fast and Veo 3, plus Kling 2.0, 1.6 and 1.5. The image side adds Nano Banana Pro and Nano Banana 2 alongside Imagen 4 and Gemini Flash Image.
- **GLM models are tuned out of the box.** GLM now ships with the same guidance the other strong models get - reach for the right tool instead of giving up, and on a long task keep the checklist current and continue rather than restart - and its context and output limits match the current GLM generation instead of the older, smaller caps.
- **Playground builds richer apps and says what it is.** Generated mini-apps are now told about the helpers they already have (live web search, saved data, what Skales knows about you, notifications, clipboard) so they build on those instead of asking for keys; the suggestions stick to things that can actually be built; the screen now says it builds mini-apps; and it has a clearer icon. Quality Boost uses the current Claude Sonnet.
- **Your Wrapped badge reflects a big week.** A heavy week now earns Power User, Researcher or the new Unstoppable instead of the generic "Balanced", and the weekly activity count is no longer capped low, so a real high performer sees their real number.
- **Goals run much further before pausing, and you decide how far.** The default step budget is higher, so a long task is interrupted far less often. Settings > Goals now has a Goal step budget you can raise, or set to 0 to let a goal run to completion, checking in only at a high safety limit, which suits strong cloud models. A goal runs on its own in the background, so it can finish while you are away. When a goal splits into several independent strands, the agent can also fan them out as parallel sub-agents instead of doing each one in sequence.

### Fixed

- **A long task picks up where it left off.** When a long task pauses for you to continue, pressing Continue now carries on with everything it had already done instead of starting over, and the Continue / Auto / Stop choice appears on its own instead of only after you reload the window.
- **Turning on Codework or Swarm lands in the right place.** The enable button on those screens now opens Add-Ons, where the switch lives, instead of the general Settings page. The Codework description also explains it now lives in chat via `/codework`.
- **Playground's "what I know about you" lookup works.** It returned nothing before; it now answers from your profile.

## v11.4.20 - Skales IQ

### Added

- **Skales IQ, a free trial built in.** You can now start chatting with a capable AI model right away, with no API key of your own. Skales IQ runs on our servers, includes tool use and vision, and you can turn it on from the first-run setup or in Settings under AI Providers. When the free trial runs out you can add your own key and keep going for free, or switch to a local model.
- **Skales Stack.** A new toggle that prefers fast, deterministic local execution for tasks Skales can do without calling a model, which saves tokens and is quicker and more reliable. It shows you which local capabilities, like media, browser, and search, are ready on your machine.
- **Replies stream in more promptly.** The chat now reacts the moment the assistant produces text, so the first words and each update appear without the slight lag of the old fixed polling cadence. If the live connection is ever unavailable it falls back to the previous polling, so nothing breaks.
- **Turn a plan into action with one tap.** In Plan mode the plan strip now has a Build this plan button. It switches to Code mode and starts carrying out the plan in your bound folder, so you review the plan and press go instead of switching mode and retyping the request. You still approve the changes (or allow edits for the session), and you can pick Auto yourself for hands-off.
- **Undo any file change in Code mode.** When Skales writes, edits or deletes a file in a folder-bound chat, the change now carries a one-click Undo that restores the file exactly as it was, right from the conversation. It is saved per change before the edit happens, so you can let the assistant work and roll back anything you do not like. Undo covers file changes only; a sent message, a deploy or a git push still asks first, which is why those keep their confirmation.
- **Undo a whole turn at once.** When the assistant changed several files in one go, an Undo all changes button reverts the lot in a single tap, on top of the per-change Undo.
- **See how big a change was at a glance.** A file edit or write in Code mode now shows a small added/removed count next to it, so you can tell a one-line tweak from a rewrite without opening the diff.
- **Point Skales at a file with @.** In Code, Plan or Auto mode, typing @ now suggests the files in your bound folder, right next to your skills, so you can reference the exact file without typing the whole path.
- **Plan mode asks before it plans.** When a request leaves something open, Skales now asks one to three quick clarifying questions you answer with a tap, before it lays out the plan, so it builds the thing you actually meant.
- **Bring a file's contents in with @.** Building on the @ file picker, mentioning a file from your bound folder now sends its actual contents along with your message, so the assistant reads the file directly instead of spending a step opening it. It works in Code, Plan and Auto mode, is capped per file, and only the files you name are included.
- **The @ menu is sorted into sections.** Typing @ now groups what it offers into Skills, MCP, Workflows and Files, each under its own heading, so a longer list stays easy to scan. Workflows you have created are selectable here and drop in their /goal- command.

### Changed

- **AI Providers now leads with Skales IQ.** The provider list and the first-run setup show Skales IQ first, so getting started no longer means hunting for an API key.
- **Friend Mode starts off on a new install.** Companion check-ins are now something you switch on yourself under Notifications, so a fresh install stays quiet until you ask for it. If you already had Friend Mode on, nothing changes.
- **Discover feed alerts are off until you turn them on.** Being mentioned by someone in the Discover feed, or a post trending there, no longer notifies you out of the box. Enable Discover mentions or trending under Notifications if you want them.
- **Shorter welcome message.** The first-run greeting is trimmed and less boastful.
- **In Code mode, big projects lead with the files that matter.** The project map Skales gives the assistant for a folder-bound chat now keeps the most relevant files when it has to trim for space, so on a large codebase it finds the right file more reliably.
- **Your free Skales IQ balance goes entirely into real conversations.** The trial now spends its balance on the chats you actually have, so the free allowance lasts longer.
- **File edits apply more reliably.** When the assistant changes part of a file, a small difference in spacing or indentation no longer causes the edit to fail and waste the step; it still lands as intended. A precise model is unaffected.
- **Workflow is available out of the box.** The Workflow builder, the hand-drawn half of the GOAL system, now ships switched on for new installs, so it is in the sidebar from day one. If you had it turned off, your choice is kept; you can still toggle it under Add-Ons.
- **Codework now lives in the chat.** Codework is no longer a sidebar item or a template module. Everything it did is in the chat's Code mode (Chat, Code, Plan or Auto on a bound folder), and Codework itself stays reachable any time with the /codework command. Existing users keep full access; there is simply one coding home now instead of two to keep in step.
- **The Ollama model marketplace starts collapsed.** On the AI Providers screen the long model marketplace is now a section you expand when you want it, so the page stays scannable, and a couple of lighter Gemma 3 sizes are listed for smaller machines.
- **The sidebar reads cleaner in non-Latin languages.** A couple of plain menu words that were still in English for Russian, Chinese, Japanese and Korean (Business, and Templates in Russian) now show in the local script. Product names like Lio AI, Swarm, Discover, Spaces and Studio stay as they are, the same way an English app keeps them, so nothing reads as a clumsy literal translation.

### Fixed

- **Switching back to Skales IQ is one click.** If you move to your own provider and later return to Skales IQ, it picks your existing trial back up instead of asking for your email again.
- **A nearly used-up Skales IQ trial now warns you in the chat**, not only on the Settings screen, so you are not surprised mid-task.
- **Notifications no longer pile up.** Identical alerts arriving in quick succession are collapsed into one, so a chatty feed can never flood the notifications list or stack a wall of toasts.
- **Toasts sit in the top-right corner again.** They could drift into the middle of the window and shift around when you clicked elsewhere; they now stay pinned where they belong.
- **Scheduled tasks and reminders fire on their own again.** A schedule ran when you pressed Run by hand but would not always go off by itself, even with Autopilot on. It now fires reliably at the set time on all systems, including Windows. The macOS case where the app had been put to sleep in the background, and reminders saved with an unusual time format, are handled too.
- **A reminder shows up the moment it fires.** A scheduled reminder or task result now appears live in the open chat, and as a notification and toast, instead of only after you reload the conversation.
- **The chat could fail to reply on an older profile.** If your saved profile came from an earlier Skales version and was missing some fields, the assistant could hit an error while assembling its context and simply not answer. Skales now fills any missing profile fields from the defaults as it loads, and re-completes them after its background identity upkeep runs, so an older or partially written profile no longer breaks a reply.
- **Skales Stack handles grouped numbers correctly.** A sum written with thousands separators ("1,000 + 1" or "1.000.000 + 1", and the same in percentages) could be answered wrong because the separator was misread. Those are now handled correctly, and plain numbers and ordinary decimals stay instant.
- **A used-up Skales IQ trial gives a clear next step, not a confusing error.** When the free trial runs out while it is your active provider, you now see the plain "trial used up" message and a button to choose another provider, instead of the chat failing with an unrelated local-model error. A trial that was ended on the server is recognized right away rather than retried, and an expired trial can no longer be re-selected by mistake.
- **Skales Stack stays out of the way while you are coding.** In a folder-bound Code, Plan or Auto chat, a quick "what time is it" or "5+5" no longer short-circuits past your code session; the folder, repo view and your code model stay in charge.
- **The Skales IQ consent line reads correctly in every language.** The data-notice sentence shown when you start the trial was breaking mid-sentence in German, Japanese, Korean, Turkish and Vietnamese. It now reads as one proper sentence in all twelve languages, and the trial skip notice, the email field label and the Skales Stack capability chips are translated too.
- **A skipped trial task no longer looks like a failure.** A scheduled task that is not run on the free trial now shows as a neutral skip on the Schedule page instead of a red error, and no longer sends a false "task failed" alert each time it recurs.
- **Two different reminders that happen to read alike both arrive.** The duplicate-collapsing that keeps a chatty feed from flooding your notifications was a little too eager and could merge two genuinely separate reminders or task results into one. Per-event notifications now always come through; only true repeats of the same alert are still collapsed.
- **A stuck step no longer becomes a goal.** If the assistant gets stuck repeating the same step on a simple request, it now stops with a short honest note instead of quietly parking the rest as a long-running goal. Goal hand-off still happens for genuinely long tasks.
- **A file change shows its diff and Undo without a click.** A write or edit in Code mode now puts the colored before-and-after, the added/removed count and the Undo button right in the conversation, instead of tucking them inside the collapsed activity panel, so you see what changed at a glance.
- **An approval card from another chat no longer lingers.** After a reload, a pending approve-and-run prompt that belonged to a different conversation could briefly appear in the chat you were looking at. The chat now drops any approval that does not belong to the conversation in view.
- **The Skales IQ brand mark sits still.** The faint gecko watermark on the Skales IQ panels, in first-run setup and in Settings, was shifting as the panel grew taller; it is now pinned to the top corner and a touch smaller, so it stays put.

### Easter eggs

Since a few of you have written in asking, here is the full list of the hidden bits in Skales. You can also just ask Skales which easter eggs it has and it will list them.

- **`/coffee`** - a tongue-in-cheek "still brewing" reply.
- **`/servus`** - a Viennese hello back.
- **`/wien`** (or **`/vienna`**) - a greeting from Vienna with an ASCII Stephansdom.
- **`/sachertorte`** - the authentic Vienna Sachertorte recipe card.
- **`/nudge`** - shakes the Desktop Buddy window, MSN Messenger style (or press Cmd/Ctrl + Shift + N).
- **`/barrelroll`** (or **`/do a barrel roll`**) - spins the chat a full 360 degrees.
- **`/highfive`** and **`/bow`** - an animated 🙌 and 🙏.
- **`:gecko:`** 🦎, **`:bubbles:`** 🫧, **`:paw:`** 🐾 - inline animated emoji.
- **The Konami code** (up up down down left right left right B A) - unlocks a gecko surprise.
- **Click the Skales logo seven times** - collect the seven secrets; all seven earns "Master of Geckos".
- **Shake the Buddy window three times fast** - it asks you to stop shaking the gecko.
- **Start a fresh chat with "hello skales"** (or hi / hey skales) - a personal greeting just for you.

## v11.4.10 - Run ▶️

> **Scheduled reminders and tasks actually run and arrive, on any model. Integrations that were only promised now actually work. Autopilot can be paused again, code in chat stops turning into math, and your scheduler state is safe from silent corruption.**

### Fixed

- **Integrations that were only promised now actually work.** A regression from the v10 settings and sidebar reorganization: a number of integrations got a place in Settings and were announced to the assistant as things it could do, but their tools were never wired up, so the assistant said "that tool is not available" the moment you asked. Google Docs, Signal, Slack, Discord, the network scan and email reply are now connected end to end, so once you set the integration up the assistant can actually use it. Webhooks, which is an inbound trigger with nothing for the assistant to call, no longer pretends to have a tool.

- **The assistant stops claiming an integration it does not have.** Every integration was announced to the assistant the moment it was switched on, even before you connected the account, so it would confidently offer to post to Slack or read a Google Doc and then fail. It now goes by live status: a tool is only offered once the integration is actually configured, and the capability list marks each one connected or needs-setup, so the assistant points you to finish setup instead of failing silently.

- **Scheduled reminders and tasks actually run, on any model.** A reminder you set ("remind me at 20:00") could be skipped before it ever ran, both when it came due and when you pressed Run by hand, with nothing delivered. Before running a task Skales asked a model to rate its own confidence against a fixed tool list that did not even include the reminder and messaging tools, so an honest model scored a deliverable reminder low and the task was dropped at "0/100". Skales now runs the task directly and lets it report honestly if it truly cannot finish, so your reminders and scheduled jobs come through whatever model you run, including a small or free one.

- **Pausing Autopilot actually pauses it, and a task you start runs.** The pause button followed the background runner, which Friend Mode and the Always-On agent keep alive, so it sprang back to on and would not switch off, while the task queue it controls was already off. A task you added then sat there doing nothing while the page still looked like Autopilot was running. The switch now follows your real Autopilot setting, so off means off and on means your tasks run, and a warning tells you when you add a task while it is off. Friend Mode is untouched.

- **Code and shell commands in chat render as text, not math.** A message containing a dollar sign, a PowerShell $variable, a price, a snippet, could be swallowed and shown as italic mathematics. Single-dollar math is now off, so those read as plain text; genuine block math still renders.

- **Video and Type exports finish cleanly and keep their download.** An export could finalize with an empty download link and skip saving to your gallery, with only a toast to show for it, because the job was flipped to done a moment before its file was attached. An export now completes only once its file is really there, and the Download button stays until your next render instead of disappearing after thirty seconds while you still needed it.

- **Your scheduler and settings files cannot be silently corrupted.** Planner tasks, cron jobs and settings were written in a way that a crash or a power cut mid-write could leave half-written, and a damaged file was then quietly read as empty, so scheduled tasks, jobs or even settings could vanish with no sign while the file still sat on disk. Writes are now all-or-nothing, and a file that cannot be read is set aside as a copy and logged instead of being silently dropped.

- **Your phone and paired devices stop dropping every few minutes.** The relay that links your phone, your paired computers and Teams was closing healthy connections after five minutes, so the mobile app, QR pairing and Teams sessions fell into a constant reconnect loop. A connection is now kept alive for as long as the device is really there, and only genuinely dead ones are cleaned up, so the link stays stable through long sessions and slow mobile networks.

- **A task you send over WhatsApp, Telegram or the Buddy no longer chokes on a big result.** A long file or a long page read through a tool used to be handed back whole and could overflow a smaller model partway through, so the job died with a provider error. It is now sized to the model the same way the desktop chat already does, with anything genuinely large saved to a file the assistant can page through, so the task runs to the end.

- **A weaker model stops burning a whole channel task on one repeated step.** The loop protection the desktop chat has, which notices a step that already ran with the same input and moves on instead of repeating it, now runs on WhatsApp, Telegram and the command line too. A model that used to circle on the same call until the budget ran out now gets more done.

- **A capable model gets more room to finish a multi-step job from your phone in one go.** A task sent over Telegram or WhatsApp keeps a safe step limit on a small or local model, but a strong model is given a larger budget, so a real piece of work is far less likely to stop halfway. When it does need more than one message, the reply you send simply continues it.

- **Scheduled reminders and tasks reach the background scheduler.** The 60-second pulse that runs reminders, scheduled tasks, Friend Mode and identity upkeep called the local server on "localhost", but the server listens on IPv4 only, and on current runtimes "localhost" can resolve to the IPv6 address first (common on Windows). When it did, the pulse never reached the server and nothing scheduled ever ran, while the app looked completely normal. The pulse now uses the IPv4 address directly, so a reminder set for 13:11 fires at 13:11. This was the cause behind reminders that were created but never arrived.

- **A reminder with an odd time still fires.** A reminder whose time came back in a form other than 24-hour HH:MM (for example "5:56 PM", "17.56", "1756"), which a smaller model can produce, was stored as-is and then read as never due, so it sat enabled and silently never ran. The time is now normalized when the reminder is created, and a reminder that somehow still has an unreadable time is logged instead of failing in silence.

- **Reminders also survive App Nap on Mac.** On macOS the system could suspend the background pulse once the window lost focus. Skales now keeps the scheduler alive while it runs, so a reminder fires whether or not Skales is the front window.

- **Line breaks in Type are kept.** In Studio's Type, pressing Enter now starts a real new line in both the live preview and the exported video, instead of being flattened into a space, so a two or three line headline lays out the way you typed it.

- **Discover spaces show their full history, not just the last few hours.** A space like Skills could look empty even when people had shared plenty, because it only ever scanned the most recent slice of the feed and busy chatter pushed the older posts out of view. Each space now pulls its whole history from the server, newest first and paged, so shared skills, studio work and the rest stay findable for as long as they live in the feed.

- **What you share from Studio actually turns up in the Studio space.** A shared image or Skales Visual landed in the feed but could not be reached through the Studio tab, so it felt like it had vanished. Shared Visuals are now filed under the right space and surface there alongside your images.

- **Sharing from Studio no longer posts your prompt as the caption.** Sending an image or a Visual to Discover used to attach the generation prompt as the post text, which read as noise. It now uses a neutral caption, and your name is already on the post.

- **A poll in Discover shows once.** A shared poll used to render both the structured poll and a duplicate of its raw question and options as plain text. The poll now shows on its own, and a post with no text no longer leaves an empty line.

### Added

- **See your own Discover posts in one place.** A My Posts view in Discover gathers everything you have shared, including anything still waiting on review, so you can find your own work without scrolling the whole feed.



- **Reset the scheduler when it gets stuck.** A new button in the Autopilot Control Room backs up and rebuilds the scheduler, planner and autopilot state in one step, clears any stuck run and restarts the background runner. Your settings, keys, Friend Mode, chats and memory are kept, and a backup is saved first, so it is a safe way out when scheduling has tangled itself up.

- **Skales now learns from WhatsApp, the Desktop Buddy and the desktop chat, not only Telegram.** What matters to you, your projects, your wording, the things you ask it to remember, is now built up from the surfaces you actually use rather than a single one, so it becomes a better companion wherever you talk to it. On WhatsApp only your own conversation feeds your memory; a contact you let through never writes to it.

- **Friend Mode can reach you in the Desktop Buddy bubble.** A new option under Notifications, Friend Mode, lets a proactive check-in appear in the Buddy bubble alongside your main channel. It stays quiet while you are already chatting on the desktop, and it is off until you switch it on.

- **Choose how Friend Mode sounds: Friendly or Business.** A new toggle in the Friend Mode box keeps the warm companion voice by default, or switches proactive check-ins to a neutral, concise note for when you want the nudge without the small talk. Only the voice changes; what it knows about you and the topics you asked it to drop stay exactly as they were.

- **In Code mode you see a real before and after for every change.** When the assistant edits or writes a file in a folder-bound chat, the change now shows as a green and red diff right in the conversation, so you can read what moved at a glance instead of just a note that a file was touched.

## v11.4.0 - Animate:Type 🎬

> **Turn a line of text into an animated, looping video right inside Studio, plus more reliable tool execution on any model and a set of long-standing rough edges gone.**

### Execution

- **Tool results stop getting cut off.** When Skales read something through a connected tool (a GitHub issue, a Notion page, a long file), the result was trimmed to a tiny slice before the model ever saw it, so the model worked from half the picture and sometimes filled the gap by guessing. Results now arrive in full, sized to the model's context, with anything genuinely huge saved to a file the model can page through, so nothing is silently dropped. You will feel this most when reading issues, pages and large files through tools and MCP servers.

- **Files actually get written, even from a weaker model.** A model writing a large file (a long HTML page, a report) could trip over its own formatting and the whole write was thrown away, so a task looked busy but produced nothing. Skales now recovers the file content in that case and writes it, instead of dropping the action. Models that already format correctly are unchanged.

- **Weaker and local models call tools more reliably.** On a turn where Skales offers tools, a per-model profile now samples more steadily, so a model emits well-formed tool calls instead of malformed ones, and it is reminded never to claim it did something (wrote a file, sent a message) unless a tool actually confirmed it. This is the difference between a model that circles and apologizes and one that gets the job done. Frontier models are untouched.

- **LLM Profiles cover today's models.** New built-in profiles for Mistral's Devstral coding model and NVIDIA's Nemotron, which previously matched no profile and ran untuned, plus an optional per-model setting for how a model samples specifically while calling tools. Profiles never remove a tool or a capability; they only help a model use what it already has.

### Fixed

- **The "Fallback active" banner only shows when fallback is actually on.** After a one-time provider failover, the orange banner could stay up long after you turned provider fallback off, even pointing at a provider you were not using. It now clears the moment fallback is disabled and never appears while fallback is off; a real failover still shows it.

- **Your chat history shows the date, not just the time.** Each conversation in History now shows the day and the time in your language, so a chat from last week reads as last week. Every conversation also has a download button to save its full transcript as a Markdown file, from the desktop app or a remote browser.

- **Skales Visuals stop coming out blank.** A visual built from a rich prompt could screenshot before its fonts and content had painted, landing a blank white image in your gallery as if it had worked. Skales now waits for the page to actually render, checks the result is not blank (and retries, then tells you instead of saving an empty image), and no longer pushes photo-camera styling into a design that is really HTML, so your colors, fonts and layout come through.

- **Discover suggestions and the background Briefing refresh are steadier.** A malformed leftover entry can no longer sit in the suggestion queue, and both the suggestion generator and the every-3-hours Briefing refresh now record clearly when and why they ran, so a quiet feed is diagnosable instead of silent.

- **Display fonts in Type and Studio always load.** A font that does not publish the exact weight you picked no longer drops silently to a plain system font in the live preview and the exported video. Skales now asks the font service for a weight the font really has, so the typeface you chose is the one you get.

- **Video export ends cleanly, and a transparent clip says so.** A failed encode now reports a clear error instead of being able to disturb other background work, and when you pick the transparent background the buttons and the gallery label the result a WebM (alpha), which is what it is. A transparent export your machine cannot encode now stops with that clear error instead of hanging.

- **Your connected MCP tools show up in chat.** With MCP servers connected and running, the assistant now sees and calls their tools directly, and when you ask what it can do it lists your actual servers and their tools by name instead of a generic placeholder. It no longer tells you it has no MCP tools when the tools are right there.

- **A colorful Skales Visual is no longer mistaken for blank.** A design whose background is a gradient or image set in its stylesheet is kept, instead of being rejected as an empty render.

- **A designed PDF does not stall on a slow font.** Rendering a PDF from HTML waits only briefly for a web font, then prints with what is ready, so a slow font host can no longer hang the export.

### Added

- **Choose how often each kind of notification reaches you.** On the Notifications page, each group (Tasks and Planner, Calendar, Messages and Email, Companion, Discover) now has a frequency: Instant, Often, Once a day, or every 12 hours. Throttling only affects live pings (toasts and channels); every event is still recorded on the Notifications page, and important ones (an approval you need to give, a contact writing you) always come through. Everything starts on Instant, so nothing changes until you turn it down.

- **Type: turn text into an animated video, free.** A new Studio tab (Type) makes a looping animated video from a line of text, with no AI and no setup. The headline is a set of fourteen Motion presets driven by a real timeline engine, with custom easing, per-letter staggers and depth (Cascade, Drop, Pop, Bounce, Slide, Reveal, Flip 3D, Spin, Wave, Breathe, Glitch, Neon, Shine, Typewriter); pick one and it just works, no knobs to set. Eighteen simpler presets sit below them. Choose a font, weight, colors, background and length, set the aspect, and keep Loop on for a clip that repeats without a jump. Watch the live preview, then export an MP4 through the same renderer Skales already uses for video. Pick the transparent background and it exports an alpha WebM you can drop on top of other footage.

- **Designed PDFs come out clean.** Skales now renders a designed PDF straight from HTML as a proper A4 document, with real page breaks and backgrounds and colors intact, and no browser print header or footer pasting file paths and timestamps across the top and bottom. So a brochure, a product sheet or a branded report looks the way it should, instead of an improvised browser print. Plain editable text still goes through the document writer and data tables through the spreadsheet writer.

### Changed

- **The advanced provider settings sit together at the bottom.** Per-Mode Model Overrides, Per-provider Timeout, Retries and Override Model Limits are now grouped at the end of the AI Provider tab instead of being scattered through it. Your saved values are untouched. A short note under Advisor Strategy now also explains how Advisor, your chat model choice and provider fallback relate, so it is clear which one wins.

- **Notification frequency reads from most to least.** Each category's frequency now runs Instant, Often, every 12 hours, then Once a day, so a step to the right always means fewer live pings.

- **The custom personality box explains itself, in every language.** The Soul / System Identity field now says plainly that it is your own system prompt and overrides the personality preset, and that Skales' long-term identity and memory are kept separately. Its description is now translated instead of English-only.

## v11.3.6 - Schedule Recovery ⏰

> **Missed reminders come back, and schedules stop failing in silence.**

- **A missed reminder catches up instead of vanishing.** A one-time reminder set for a moment the app was closed used to be lost for good - it kept showing as Active but never arrived. It now comes through the next time you open Skales, marked as overdue, and a reminder too old to still make sense is cleared away instead of sitting there forever.

- **Recurring reminders no longer need the app open at the exact minute.** A daily, weekly or monthly reminder now arrives on the first check at or after its time, so a closed lid or a busy moment right at the scheduled minute no longer skips the whole day.

- **The Schedule log tells you when nothing ran.** If a scheduled task is held back because the Always-On Agent and Autonomous Mode are both off, the log now says so, instead of sitting empty and looking broken.

- **A stuck approval no longer freezes the chat.** If the app restarted while an action was waiting for your confirmation, the approval card could hang with dead Approve, Cancel and Stop buttons, and kept waiting even after you left and reopened the chat. It now clears itself on the next start, and the buttons work again on a reopened card.

- **Scheduled and recurring tasks report back in the app.** A task that runs in the background - a reminder, a recurring job, the daily stand-up - now delivers its full result into chat as a message you can read and reply to: in the conversation that asked for it, or in a dedicated Tasks chat. So even with no WhatsApp, Telegram or email connected, the report still reaches you. You can turn it off under Notifications.

- **Some models stop spilling their actions as text.** On certain connections a model would print the inner workings of an action into the chat instead of carrying it out. Skales now understands that, so the action runs and the clutter never reaches you.

- **A schedule it cannot read is caught right away.** Asking for a repeating task with a timing Skales cannot make sense of is now turned down with a clear example, instead of quietly creating a schedule that could never run.

- **Strong models keep all their tools, small ones keep the right ones.** A capable model (DeepSeek V4 and the like) was being treated as a tiny one and cut down to a handful of tools, so it could not even create a reminder - that is fixed, it now has the full set. A genuinely small model still keeps the essentials (files, web, email, calendar, reminders, schedule), and a model unsure which tool fits now looks it up instead of guessing. "remind me at 20:50" reliably becomes a reminder again, not a failed calendar entry.

- **A model that reaches for the wrong tool name still gets it right.** When a model wrote out a tool call under a name borrowed from another tool (create_file, str_replace, bash) or with a small typo (write_files), Skales used to quietly drop it, so it looked like nothing happened. It now recognizes the intended tool and runs it, so smaller and local models get more done on the first try. Models that already name tools correctly are unaffected.

- **The agent stops re-running the same step dressed up differently.** A repeated tool call that differed only in how a path was written ("src/index.ts" versus "src/./index.ts") or in the order of its fields used to slip past the loop guard and burn steps for nothing. Those now count as the same call, so a weaker model wastes far fewer steps going in circles.

- **Long working chats no longer run out of room mid-task.** A long back-and-forth that uses tools, especially on a small local model, could fill the context window partway through and stop with a provider error. Skales now shortens the conversation on its own when it gets tight during a task, not only at the start, so the work keeps going.

- **Code changes show up as a real diff, not a wall of text.** When the agent shows you a git diff in chat, it now renders the way you expect: green added lines, red removed lines, so you can read a change at a glance instead of squinting at plain text. A very long diff is trimmed with a note to open the file for the rest.

- **Code mode sees the whole project, not just the open folder.** When a chat is pointed at a folder (Code, Plan or Auto), Skales now builds it a map of the project, which files exist and what each one exports and imports, and hands that to the model, so it heads straight for the right file instead of reading its way around a larger codebase. The map is built once and reused, and a small project skips it since the plain file list is already enough.

- **Pick Code, Plan or Auto right from the start screen.** The Chat/Code/Plan/Auto switch is on the New Chat screen now, not only inside an open chat, so you can point a chat at a folder and choose how it works before you type the first message. A folder outside the allowed area asks the same way it does inside a chat (add this one folder, or full disk access), and your choice carries over so the very first message already works in that folder.

- **The mode bar under the composer no longer pops in.** The context readout and the Chat/Code/Plan/Auto strip used to flash in a moment late on a fresh chat, around the time the first reply started. They are there from the first paint now.

- **The coding agent stays anchored to your folder.** On a long coding task a weaker or hotter model could drift: talk about a different folder than the one you bound, or apologize in circles instead of just re-running the check. Skales now keeps every model grounded in the bound folder and the live working state, and asks it to confirm a path or a file's contents with a tool before stating them, so it acts on what is really there instead of guessing.

## v11.3.5 - Hide & Seek 🔍

> **The background comes back to life.**

- **Scheduled tasks, goals, reminders and proactive messages run reliably again.** On some setups the background work could quietly stop while the app looked completely normal. It now runs dependably, every launch.

- **Friend Mode reaches you on WhatsApp again.** Check-ins arrive on schedule, and WhatsApp is ready in the background so they actually get delivered.

- **One stuck job no longer holds up the rest.** A single long-running task can no longer block everything else waiting in the queue.

- **A Multitask job no longer leaves the chat stuck.** If a multi-agent job got interrupted, the chat used to keep showing it as running with no result. It now recovers cleanly and shows the job as interrupted.

- **Skales stays Skales on every model and in every mode.** In some situations - Deep reasoning, Code mode, a running goal, the document panel, or a custom Agent - the assistant could lose its identity and even claim to be a different AI. It now keeps its identity, its tools and its safety rules in every mode.

- **Identity Maintenance is set up for you.** The nightly memory-and-identity routine is ready out of the box (you can still turn it off).

## v11.3.4 - Notifications 🔔

> **One clear home for notifications, and they explain themselves.**

- **One place to manage notification types.** Notification settings used to appear in two spots. There is now a single place for them, on the Notifications page, with a link from Settings.

- **Every notification type explains itself.** Each switch has a short description of what it is, grouped by topic: Tasks & Planner, Calendar, Messages & Email, Companion and Discover.

- **Discover has its own switches.** Mentions and trending posts can now be turned on or off on their own.

- **No more repeated rows in your inbox.** Recurring updates no longer pile up as duplicates: one entry per event.

- **Notification titles read properly in your language.** Titles always show a clean, readable name.

- **WhatsApp stays linked across updates.** After an update WhatsApp reconnects on its own, so you no longer have to restart it and re-scan the code every time. One last scan after this update, then it holds.

- **Cloud API keys save reliably.** Adding and activating a provider now saves its key right away, so it is there when you open Chat, with no extra step.

- **Desktop buddy light mode, completed.** The screen-share button and the window picker now look right in light mode.

## v11.3.3 - Skales.app 🌐

A stability release. Less magic talk, more things that just work: reminders land at the right time, long tasks finish instead of starting over, and proactive messages actually reach you.

### Fixed

- **"Remind me in an hour" lands in an hour.** Relative reminders could end up at the wrong time. Skales now reads the real clock for them instead of doing the maths in its head, so "in 30 minutes", "in two hours", "tonight" all hit the moment you meant.

- **Long tasks finish instead of starting over.** On a bigger job the agent could re-write its checklist again and again, re-figure out where it was working, and burn through its budget without delivering. It now keeps one plan, ticks items off, remembers the original request and where it works, and carries that through to the end, even on smaller and local models. You will feel this most on multi-step work.

- **The progress card tells the truth.** The "X of Y done" on a running task sometimes showed 0 while the visible checklist was clearly further along. The card now reads the same checklist you see.

- **Files with many lines actually save.** A document or report the agent wrote could silently fail to be written on some models, so the task looked busy but produced nothing. Fixed - the file gets written.

- **Proactive messages reach you again.** Friend Mode check-ins and buddy nudges could go quiet entirely. They are back, and if the channel you picked is unreachable (for example WhatsApp needs a fresh QR scan), you now still get a notification instead of silence.

- **Reply to a forwarded message and it goes to the right person.** When Skales relays a message from one of your contacts and you answer with a short "you're right" or "tell her yes", it now understands your reply belongs to that contact and sends it to them, instead of getting confused.

## v11.3.2 - Re-Buddy

Your buddy does more than ever. The Desktop Buddy is Skales' most-used feature, and this release hands it everything the rest of Skales learned in the meantime - and that is just the beginning.

### Re-Buddy

- **The buddy finishes real tasks now.** It used to take exactly one step: decide, run a tool once, summarise. Now it runs the full agent loop - with the same generous working budget the channels get - calling tools, reading results and continuing until the job is done. "Clean up my downloads folder" actually cleans up your downloads folder.

- **Approve and it keeps going.** Approving an action from the speech bubble used to end the conversation with a one-line summary. Now the buddy executes what you approved and continues the task, asking again if the next step needs another approval. Declining is recorded honestly, so it never claims it did something you blocked.

- **The buddy has its own conversation.** Buddy turns used to be written into whatever chat session happened to be active, polluting your work conversations. The buddy keeps its own thread now, and "Open Chat" jumps straight to it - with the full transcript of everything it did.

- **It knows you.** The buddy speaks with the personality you configured under Settings > Identity, answers in your language instead of defaulting to English, and recalls relevant memories about you before answering.

- **Watch the buddy work, step by step.** While a multi-step task runs, the speech bubble now shows live progress lines ("created the folder", "email sent") as each tool finishes - no more staring at a silent mascot wondering if anything is happening.

- **The bubble follows your theme.** On light app themes the buddy speaks in a light bubble with dark text; dark themes keep the classic dark bubble.

- **Bubbles show the whole answer.** Longer replies were hard-cut after about 110 characters - mid-sentence - and a bubble with approval buttons could grow past the edge of the buddy window. Full answers scroll inside the bubble now, on every path, and the bubble can no longer outgrow its window.

- **Make your OWN buddy.** A "+" card next to the pixel skins opens the pet creator: pick a body shape, color, eyes, ears, tail and an accessory, watch the live preview breathe, hit create - your pet is installed with all nine animation states, rendered locally in seconds, no image model, no cloud. Or just tell Skales in chat: "make me a purple octopus buddy" - the agent has the same generator as a tool and activates the result for you.

- **Custom pixel skins - the one you asked for, twenty updates in a row.** The buddy now wears animated pixel pets in the open Petdex sprite format. Three Skales originals (Skales, Bubbles, Capy as pixel pets) ship built in, and any pet from the petdex.dev gallery imports with one paste under Settings > General > Buddy Skin. The pet reacts to your agent: it inspects while Skales thinks, waits during approvals, slumps on errors, jumps when the task lands, and waves hello. You can draw your own too - the format is two files.

- **Discoverable again.** Desktop Buddy and AIPointer now have proper cards on the Add-Ons page that drive the same switches as Settings > General.

### Improved

- **Tasks via WhatsApp and Telegram get four times the room.** Bigger jobs sent from your phone used to hit a tight internal step budget meant for quick replies - the agent runs on your desktop, not on your phone, so the cap made no sense. The budget is now sized for real work, and proper multi-step jobs finish from a single chat message.

- **Your channel activity shows up in Discover.** WhatsApp and Telegram conversations relayed through Skales now appear as feed events (opt-in sharing only, counts - never content), so your Discover presence reflects what you actually use.

- **Sharing your Wrapped goes straight to the feed.** Re-sharing a Wrapped no longer lands in the moderation queue first; it appears in Discover immediately, with a sensible flood guard instead of a once-per-days rule.

- **Discover got a personality transplant.** The community agents run on a sharper model now and are required to have a take - opinions, small fails, dry humor and friendly banter instead of interchangeable filler. The same goes for your own agent when you hit Reply on a post.

- **LLM Profiles refreshed for the current model generation.** New dedicated profiles for DeepSeek V4 (vendor sampling, full tool access - the old generic cap starved it of most tools) and Qwen 3.5; updated MiniMax (M2.7/M3), GLM-5 and Kimi parameters per the official model cards. Profiles also teach models eight more real tool names (reading the inbox, calendar, image generation, asking you a question, searching past chats), so models that reach for another framework's names stop circling and find the right tool first try. Importing a profile by URL now accepts normal GitHub/GitLab file links too - they are rewritten to the raw file automatically, and a URL that returns a web page gets a plain-language error instead of a JSON parse message.

- **Group Chat, VirusTotal scanning, System Monitor and Local File Chat ship enabled.** Four add-ons that work out of the box (or degrade gracefully) were off by default, so most users never discovered them. New installs get them active; existing installs keep whatever you chose.

### Removed

- **DLNA Casting is retired.** Casting a media URL to a TV worked, but reliable screen and media streaming across the device zoo never met the quality bar, and we would rather remove a half-feature than ship one. The page, the add-on card and the agent tools are gone; if it was enabled on your install, it is turned off cleanly.

### Fixed

- **Fresh installs no longer hide half the sidebar.** On a brand-new installation the add-on state file does not exist yet, and the sidebar read it raw - so Studio, Lio AI, Playground and every other add-on entry was missing until you toggled something on the Add-Ons page. The sidebar now sees the shipped defaults from the first launch.

- **Your inbox is checked even when no window is open.** Email polling was driven by the dashboard UI, so a Skales running headless (server, minimized to tray, remote-only use) never checked for new mail and the unread-mail nudge never had data. The inbox check now runs in the background scheduler on your configured interval (default every 15 minutes, set it under Settings > Email), works with the lid closed and pings you via your notification channels.

- **"A contact wrote you" pings have their own switch now - and they are back.** The WhatsApp ping that tells you a whitelisted contact (your mum, your wife) messaged you was internally riding on the "Planner and briefing nudges" notification type. Anyone who unchecked planner nudges on the new Notifications panel silently lost contact pings too. They are their own type now ("A contact wrote you"), on by default, and unchecking planner nudges only affects planner nudges.

- **The Notifications panel warns about the approval footgun.** "Task blocked / needs you" also carries approval requests; unchecking it meant runs waiting for your decision could not reach you. The panel now shows a clear warning when that type is disabled.

## v11.3.1

### Fixed

- **The agent loop got a backbone - and every model benefits.** Long, multi-step tasks used to fall apart: plans were recreated from scratch, the same actions ran again and again, and runs burned their step budget without finishing. Skales now keeps the agent on track itself, step by step - it knows its plan, what it already did and what comes next, whether you run a frontier model or a small local one. Big tasks finish noticeably more often, in fewer steps.

- **Skales stops forgetting.** In long conversations, recent messages and the agent's own checklist could effectively get lost, and a long-running task could even lose track of the original request. All three are fixed: the latest messages always survive, the checklist stays, and the original request stays the task. You will feel this most in long sessions and on smaller models.

- **Dreaming runs on its own now.** The nightly memory consolidation could silently skip a day - and then every day, so the dream diary only ever grew when triggered by hand. It now runs reliably on its schedule, retries on its own when something gets in the way, and a failed run is visible in the dream diary instead of disappearing without a trace.

- **Discover and your stats see more of what you do.** Discover captures more events and tools than before, Wrapped gets three new categories (Voice, Messaging, AIPointer), and a few activities that were counted under the wrong label are attributed correctly now.

- **Notification titles speak your language.** The row titles on the Notifications page now follow your app language in all 12 languages. The notification texts themselves were always generated in your language and style.

- **Friend Mode reaches active users.** If you actually work at your computer all day, proactive check-ins simply never came, on any frequency. Now they arrive on your phone on schedule (WhatsApp, Telegram or email) while you work.

- **WhatsApp stays linked across updates.** The QR code had to be scanned again after every update while Telegram was unaffected - fixed. One last scan after installing this version, then never again.

- **Approving a Discover suggestion works reliably - including remotely.** Approving a suggestion could fail with "You are offline" despite a perfectly fine connection, especially when using Skales from another device. Fixed everywhere.

- **Multi-step work in plain chat just runs now.** The agent could waste its entire budget on finding a place to work before doing any real work, then start over. It knows its workspace from the first step now and gets straight to building - including remotely, where you cannot pick folders.

- **The Continue card appears without reloading.** When a goal paused in the background, the "Continue / Auto / Stop" card only showed up after a browser reload. It appears live now, with working buttons.

- **Continuing a goal continues THE plan.** After a pause, the agent no longer starts over with a brand-new plan - it picks up its existing checklist exactly where it stopped.

- **Mute and choose your notifications.** The Notifications page has a settings panel now: mute all live notifications with one switch (everything still lands on the page, and critical items like approval requests always come through), plus per-type checkboxes for all twelve kinds of notifications, from Friend Mode check-ins to planner nudges.

- **Goal progress counters read correctly.**

## v11.3.0

### Fixed

- **Attaching several files no longer dumps the second one into your message.** With two or more files attached, only the first showed as a clean chip - the full content of every further file rendered as raw text inside your chat bubble. All attached files now show as compact chips, your typed question below them, and a file whose content contains code fences cannot break the display either.

- **Drop a zip into the chat.** Archives (zip, tar, gz, 7z, rar up to 25 MB) attached to a message are saved into the Workspace and attached as a reference chip - ask Skales to extract them or read specific files from them and it will, using its shell and file tools within your permitted folders. Previously archives were rejected with a "cannot be read" error.

- **Schedules that worked before v11.2.7 fire again.** The schedule executor and the schedule queue disagreed about who may run: the queue accepted Autonomous Mode OR the Always-On Agent, the executor only Always-On. On a machine running with Autonomous Mode alone, every user schedule stayed silently skipped - shown as Active, execution log empty, nothing fired (an old hidden scheduler had masked this before v11.2.7 by running schedules on its own). Both now apply the same rule: either toggle runs your schedules. Two more honesty fixes ship with it: a schedule paused after repeated failures now actually shows as paused with a log entry saying why (it used to keep displaying Active while being skipped forever - one toggle re-arms it), and stale failure counters from the era when schedules could not really execute are cleared once, so no schedule stays blocked for failures that never happened. The Schedule page warns clearly when active schedules exist but nothing authorizes them to run.

- **Thinking traces from Kimi-style models stop bleeding into the answer.** Some serving setups start the model directly inside its reasoning and only ever emit the CLOSING think tag. The whole thought process then rendered as answer text with a stray </think> in the middle. An unopened closing tag now ends a reasoning block: the thoughts land in the collapsed reasoning trace, the answer stays clean, and any further stray tags are removed.

- **The update restart is silent now.** Clicking "Restart Now" tears down the internal server and the messaging bots before the installer runs - and for a split second the still-open window showed that dying state as an error flash. The windows now hide first, then the teardown runs; the app simply closes and comes back updated.

- **Release notes on the Update page too.** The same scrollable What's New block as in Settings now sits on the page where downloading and restarting actually happen, so you can read what you are about to install.

- **What's New lives inside the app.** Settings -> Advanced -> Updates now shows the release notes in a scrollable block, newest release first, the full history one click away. The notes are fetched live from skales.app, so even an older installation reads about the latest version; offline the bundled copy steps in, and a freshly updated build that is ahead of the website automatically shows its own newer notes.

- **Team and Swarm pages introduce themselves.** The first visit shows a short, dismissable explainer of what the page does and how to get started: what to enable on the second device for Swarm, and how pairing, the You/Agent switch and the dual-approved shared plan work for Teams. One "Got it" and it never comes back.

- **Skales knows its own interface now.** Asking "where do I set the voice provider" or "where are the AI models" used to get a confident but wrong answer (it would invent a "Voice" tab or send you to Chat for providers). There is now a factual map of every Settings tab, page and theme that Skales consults before telling you where to click - so the directions are right whatever model is running. A build check keeps the map in lockstep with the real UI, so it can't quietly drift out of date.

- **Teams gets a shared plan - two humans, two agents, one checklist.** Open a plan in any team chat: both of you add items and assign each one to a machine (or hit "I'll take everything" to hand the whole list to one device). Nothing runs until BOTH of you approve - and any edit to the list, including a takeover, voids both approvals so nobody can swap tasks after sign-off. Once armed, each computer's agent works through exactly its own items with its own tools and keys, ticks them off with the result attached, and posts each outcome into the team thread. Agents see the conversation only from plan creation onward, a teammate's words are never instructions, and a received plan can never execute anything by itself.

- **Swarm grows up to a real beta.** Manually added devices (Tailscale, fixed IPs) no longer fall to offline after 60 seconds and now survive a restart - a health loop keeps every peer's status fresh, and manual peers can be removed again. The Swarm page's delegate form uses the same queued path as /swarm in chat, so long tasks no longer die on a synchronous timeout; one shared history shows chat AND page delegations with live status that updates when the peer reports back. A /swarm typed in a chat gets its result back IN that chat, and delegated tasks on the working device carry a 🐝 badge with the sender's name. The full command: `/swarm <task>` picks the best free device, `/swarm @name <task>` targets one, and an optional mode prefix sets how it runs there - `/swarm @name code: <task>` (coding agent), `plan:` (read-only plan), `auto:` (fully autonomous). A missing swarm secret is flagged on the page instead of failing silently at send time.

- **Discover suggestions actually arrive.** The "Your AI wants to share" cards were generated for months but could silently jam: a queue full of stale suggestions blocked every new one forever. Stale cards now clear themselves, and finishing real work (a goal, an autonomous task) nudges a fresh suggestion right away instead of waiting for the next four-hour window. You approve or skip - nothing posts on its own.

- **Wrapped lands in the feed as a picture.** Your weekly Wrapped used to be auto-posted as plain text. Now the Monday suggestion card routes through the Wrapped page, captures the real card and posts it as an image - identical pixels on every screen, no review wait. The Post button on the Wrapped page does the same, and the post carries your week's stats. Server-side, the no-review lane for Wrapped images is now hard-gated (owned entry, weekly rate, content check) so it cannot be abused as a backdoor for arbitrary images.

- **Share any gallery image to Discover.** Sharing used to be possible only in the moment of generation; the gallery now has a share button on every image, using the same compress-and-review pipeline.

- **Friend Mode is back - and cannot silently die again.** A check-in that never reached you (channel briefly down, bot mid-restart) was recorded as if it had been delivered; three of those and Friend Mode went permanently quiet, even on the hourly setting. Undelivered check-ins are no longer recorded anywhere, a failed delivery retries after about 15 minutes, and the quiet phase after three genuinely ignored check-ins now means one message per day instead of silence forever. The WhatsApp readiness check now agrees with the actual sender, and an error in Buddy Intelligence can no longer take Friend Mode down with it - each proactive feature fails alone and logs why.

- **Streaming stays in one bubble - and you can scroll away from it.** During a tool turn the live answer now streams inside the same bubble it will finally land in, instead of a second bubble that visibly collapsed into the first the moment the answer finished. Scrolling up while Skales is thinking or typing now sticks: auto-follow can no longer mistake its own scroll for your gesture and yank you back to the bottom, the scroll listeners survive a rebuilt message list, and the jump-down arrow reliably appears when you are away from the latest message (above the chat, below every popup and lightbox). The typewriter itself is now immune to list rebuilds and loading flickers - an answer could previously get stuck fully invisible (reasoning block there, text missing until reload) when the message list was rebuilt mid-turn.

- **The GIF switch does something now.** "Skales can proactively send GIFs" saved a setting that nothing in the app ever read. With the switch on, Skales may now add one fitting GIF to a casual, playful or celebratory reply on its own - in Telegram chats as a native GIF - sparingly, and never on serious or technical topics.

- **Skales types its answers as they are generated.** Replies now stream into the chat token by token instead of appearing all at once after a wait - on OpenAI-compatible cloud providers (OpenAI, OpenRouter, Groq, DeepSeek, custom endpoints) and on local models (Ollama, LM Studio, llama.cpp). The biggest felt-speed difference, especially for local models. Anthropic and Gemini native connections still deliver in one piece for now.

- **The reasoning block is there while the answer streams.** Models that think before they answer (DeepSeek, qwq, Gemini via OpenRouter, ...) show the collapsed reasoning block live, growing as the model thinks, instead of the trace appearing only after the full reply landed. The block stays collapsed and stable - no flicker, no width jumps, no answer disappearing - and expands on click exactly like before.

- **No more emoji row above replies.** Replies no longer get a decorative row of animated emojis stuck above the text; emojis the assistant writes inside its sentences render normally. The reasoning and tool icons in the trace header are unchanged.

- **The get-to-know-you question can appear after a normal chat answer.** The adaptive personalization layer used to surface its single, dismissable question only after a finished goal; a regular chat turn is now a surface moment too. Same protections: warm-up phase, a 6-hour quiet window, never during a running goal.

- **/swarm: hand a task to another of your devices.** Type `/swarm <task>` (or `/swarm @device <task>`) in chat and another Skales on your network runs it, with the result coming back to your notifications when done. No setup, no organization concept - just delegation. The receiving device must opt in (Swarm page, "Accept delegated tasks") and both devices share a swarm secret, so nothing on your network can make your machine work without consent.

- **Teams agents can actually do the work.** When you ask your agent in a team chat to do something, it now runs with this machine's full tools and posts the result to the team, instead of only being able to comment. Everything runs on your device with your keys; the teammate only ever sees the result, and a teammate's messages are treated as input, never as instructions to your agent.

- **Briefing topics deliver real news.** A keyword topic used to return generic search-result links; it now pulls fresh articles from news feeds first (direct publisher links), with web search only as a last resort. Pasting a site URL already expanded its RSS feed - now both subscription types read like an actual news feed.

- **"Remind me in an hour" becomes a real reminder.** The assistant sometimes created a plain to-do for time-based reminders, which fired at the wrong moment or not at all - and then picked its own channel for the message. Time-based phrasing now routes to a real scheduled reminder, and task results are always delivered on YOUR configured notification channel; the agent no longer picks Telegram or email on its own unless you named one.

- **Two size controls under Settings → Appearance.** "Text size (chat bubbles)" scales only the chat conversation in steps from 85 to 140 percent - the rest of the app stays unchanged. "Skales size (whole window)" zooms the entire main window from 70 to 130 percent using the same mechanism as Ctrl+/Ctrl- (no layout gaps), ideal for small screens; the desktop buddy and AIPointer windows are not affected, and the control only appears in the desktop app (browsers have native zoom). Both apply immediately, persist across restarts, and reset to exactly today's look with one click.

- **Reading email works with the new multi-account setup.** The connection test was green for IMAP and SMTP, yet Skales itself claimed the inbox was unreachable: sending already used your configured accounts, but reading still looked at the old single-account settings, which are empty for anyone who set accounts up in the new UI. Reading now uses your accounts too - the full-access account first, a read-only account as fallback.

- **Voice messages are first-class on every channel.** A WhatsApp voice note to Skales was silently ignored and Telegram only knew two transcription providers; both now use the same transcription chain as the app (local endpoint, Azure, Groq, OpenAI), and when no provider is set up the message still arrives with a clear note instead of vanishing. The settings show the live chain, so you can see at a glance that a Groq or OpenAI key is enough.

- **Voice notes in chat.** Hold the mic button to record, release to send: your recording stays in the chat as a playable bubble, the transcript becomes the message, and Skales answers with voice and text as before. Works with click-to-toggle too, and the bubble survives a reload.

- **The assistant remembers its own replies to your contacts.** Outgoing messages to whitelisted WhatsApp contacts are recorded on every send path, so "what did you reply to her?" always has an answer.

- **Cleaning up tasks from chat works.** Asking Skales to delete old tasks no longer fails with a missing tool: it can delete a single task, a Planner task, or clear all finished tasks at once (optionally only those older than N days).

- **The agent-builder tool list stays current.** The tool catalogue on the Agents page is regenerated on every build instead of drifting out of date.

- **Microphone over remote access gets a real answer.** Instead of a dead-end error on plain HTTP, chat and Call Mode now tell you exactly how to get a secure connection over Tailscale.

## v11.2.7

### Fixed

- **The "Telegram gets messages although I selected WhatsApp" mystery is solved.** An older, second scheduling path inside the Telegram companion could run schedules on its own and always announced the results to Telegram, regardless of your channel choice - that is why Identity Maintenance pinged Telegram at 03:00 and schedule confirmations landed there while WhatsApp was selected. It is gone: there is exactly one scheduler now, and results follow your channel. The bot's /schedule list and toggle commands still work.

- **A scheduled prompt acts now, instead of re-scheduling itself.** A job like "send me a message every 5 minutes" was handed to the agent as-is on every run, and the agent read "every 5 minutes" as a request to create ANOTHER schedule - so it produced new schedules and confirmations instead of ever sending the message. Each scheduled run now carries an explicit "this IS the scheduled run, act once, schedule nothing" directive.

- **Friend Mode check-ins got real memory and manners.** A dead channel (stopped bot, unlinked WhatsApp, no send-capable email account) is now detected BEFORE generating - previously every cycle burned a model call and "sent" into the void forever. Email-only setups finally keep a conversation thread, so check-ins stop reading like the first message ever, every time. Skales now remembers its last few check-ins and writes something genuinely different each time. Back-off is real: an ignored check-in doubles the wait, three ignored ones go quiet until you show up again - and an answered conversation is no longer treated as ignored just because the assistant spoke last. Your reply to a check-in no longer gets mirrored back as "what you've been working on". Check-ins are recorded on the Notifications page, and duplicate check-ins are prevented.

- **Approval requests and the daily stand-up respect your channel.** Both used to go straight to Telegram whenever a bot was configured. The approve-by-reply flow still uses Telegram when Telegram is your channel; everyone else gets the alert on their chosen channel pointing to the Execution Board, and the stand-up report is generated by its own pipeline and delivered through the router.

- **Quiet hours only exist when Friend Mode is on.** With Friend Mode off, task results and reminders deliver around the clock instead of being silently muted between 22:00 and 07:00 by a feature you never enabled. Also fixed: equal start and end values (a cleared field) used to mean "quiet 24 hours a day, forever".

- **The Briefing chat stops missing out.** Opening the Briefing pane could swallow fresh links before they ever reached your Briefing chat, which made the chat look dead. Now every refresh - automatic or manual - delivers what it found to the Briefing chat. New batches open with a short model-written summary when a model is reachable (cards always deliver either way), the briefing nudge no longer shares its cooldown with unrelated notifications, and a delivery failure is logged instead of swallowed.

- **System notifications (OS toasts) work as a channel.** The setting existed and Friend Mode used it, but regular notifications (task results, reminders) had no code path for it. When no live channel is reachable at all, Skales now logs why - the Notifications page always has the record either way.

- **Codework "Undo All" only touches what the session changed.** It used to reset the whole folder, which could also discard YOUR own unsaved edits and untracked files. Undo is now strictly limited to the files this session created or modified - your own work is never touched.

- **Codework commands no longer freeze the app.** While a shell command ran, the whole app could stall (chat included), and anything over 30 seconds was killed with a cryptic error. Commands now run without blocking, get 2 minutes, and a timeout says clearly that a long build is not a code error.

- **Studio video shows an error instead of spinning forever.** When a render or cloud video job died or the app restarted mid-job, the progress bar froze and the spinner never stopped. Both now detect a dead job and report it. The Music tab also tells you a key is missing BEFORE you compose your prompt, not after - and it now recognizes a HuggingFace key configured as a provider.

- **Organization approvals behave.** Approve/Reject buttons no longer reappear after you clicked them, agents saving their work no longer stall on an approval card for a plain file save, and when an approval window expires the report says "no decision within 5 minutes" instead of falsely claiming you rejected it.

- **Chat shows work and actionable errors.** While tools run you see a live "Working: ..." indicator instead of a message that looked like a failure. And provider errors (wrong key, rate limit) keep their details after a reload, so the Retry button and error info work instead of leaving a dead end.

- **Adaptive personalization actually asks its questions now.** The question cards (one-tap answers that shape how Skales adapts to you) were armed since v11.0.0 but practically unreachable: they only fired into the currently ACTIVE chat during a narrow 20-90 minute away-window, and anyone steering Skales mainly through Telegram or WhatsApp had a channel session active, which silently disqualified every attempt. The away-window is wider now, and when the active chat is a channel session the card lands in your most recent desktop chat instead, marked unread so you see it.

- **Your WhatsApp assistant now knows what your contacts wrote.** When a whitelisted contact messaged Skales you got the heads-up, but replying "yes, add her appointment" hit an assistant that had no idea what the appointment was: the waiting-request list was short-lived (cleared once answered, expired after 12h) and Telegram - the channel most owners steer from - never received it at all. There is now a durable 14-day log of contact-thread messages in both directions. The desktop/browser chat and the WhatsApp and Telegram owner chats all see the recent thread, "what did my wife write?" and "did she answer?" work via the new read-only whatsapp_contact_log tool, and the relayed texts are explicitly marked as third-party data so a contact's message can never instruct your agent. Nothing changes for the contacts themselves: they still get the restricted persona with no tools and no access to your data.

- **LLM Profiles are on by default now.** Per-model tuning (sampling, tool budgets, tool-name corrections) measurably improves cloud and local models alike, but it shipped as an opt-in toggle that the users who needed it most never found. It is enabled by default for new installs, and existing installs are switched on once - turn it off afterwards and your choice sticks.

- **Models without tool support stop stalling every message.** When a local model can't do tool calling (gemma2, codellama and friends), Skales found that out through a silent 30-second timeout - on every single message, forever. The verdict is remembered now: the first message pays the probe once, every following message sends without tools immediately.

- **Long chats stop dying at the context limit.** Long sessions - especially on local models with small context windows - eventually failed with provider errors until you pressed Compact by hand, and a huge tool result (reading a big file) was carried in full into every following reply. Chats now compact themselves automatically near the limit, and oversized tool output is shortened with a clear marker.

- **Local models got faster and steadier.** Unknown Ollama models no longer request a 64k context window by default (which made 7-8B models swap or die on consumer hardware - the first reply took minutes); they cap at 32k until a real probe says otherwise. Per-model profile hints now survive Code mode and goal runs instead of being dropped exactly where weak models need them. Tool calls with slightly malformed arguments are repaired instead of costing an error round-trip. And the compact system prompt used for constrained models stops spending tokens on easter-egg and emoji-system documentation.

- **Autonomous Mode finally does what its description says.** "Proactively processes any pending tasks from the queue" now includes tasks you compose on the Tasks page or in chat: with Autonomous Mode on they start within about a minute, no Run click needed. Deliberately scoped: only tasks created from this version on - the backlog you parked over months stays manual.

- **Scheduled tasks actually run now.** Every cron schedule - created in chat or on the Schedule page - queued its run and then nothing ever picked it up, so every scheduled run sat at "Pending" forever, on every machine, no matter how Always-On, Autonomous Mode or Safety Mode were set, and the only thing that ever worked was pressing Run on the Tasks page yourself. Now due runs start within seconds, run with the agent's full capabilities, write their result into the schedule's execution log, and deliver it to your Notifications (and your chosen channels). "Run now" on the Schedule page also starts immediately instead of quietly never running.

- **The scheduler no longer double-queues, and old stuck runs are cleaned up.** The same schedule could fire twice in the same minute, producing duplicate runs; that cannot happen anymore. Runs that piled up as "Pending" under the old broken scheduler are retired on the first start instead of all firing at once, and a run interrupted by closing the app is marked as such instead of blocking its schedule forever.

- **Scheduled runs are labeled honestly on the Tasks page.** They no longer show as "manual" runs, and they no longer display the "System task. Turn it on or off under Settings > Memory" note in place of their actual description - that note is reserved for real system jobs like Identity Maintenance. Your scheduled runs show what they actually do, and can be deleted like any other task.

- **Scheduled-run results respect your notification channel.** The completion message used to go straight to Telegram whenever a bot was configured, even if you had selected WhatsApp or email as your channel. Results now go through the same notification routing as everything else, so they land in your Notifications page and the channels you picked.

- **One-time reminders fire even if the app was closed at that minute.** A reminder set for, say, 09:00 only fired if Skales was running at exactly 09:00 - a closed laptop silently swallowed it. A missed one-time reminder now fires the next time Skales checks, later that same day. (Past midnight it stays retired rather than firing absurdly late.)

- **Remote-access mode no longer breaks the app's internal calls.** With remote API protection enabled, the app's own internal calls were rejected as unauthorized, so a whole set of features silently did nothing on protected setups: planner-task runs, the fast post-launch tick that spawns the Telegram bot, the deploy tool, Studio video render / voice / audio merge, playbook list and run, social upload, and organization approvals (which auto-rejected after the 5-minute timeout because the approval request never registered). All of these work under remote API protection now.

- **Folder watchers act on what they see.** A folder watcher noticed changes and queued the follow-up work, but that work was never executed. Watcher tasks now run like any scheduled task and log their result back to the job.

- **Identity Maintenance can actually save its work.** The nightly memory upkeep job runs unattended, but in Safe mode its file updates hit an approval gate with nobody there to approve, so the run burned model calls and persisted nothing. With the existing "auto-approve Identity Maintenance" setting enabled, its own file updates (and only those - never shell or network tools) are pre-approved.

- **Editing a one-time reminder to a new date works again.** A one-time task that had already fired stayed permanently done even after you gave it a new date; rescheduling now resets it so the new date fires.

## v11.2.5 (+ v11.2.6 Hotfix)

### Added

- **Every notification has a home (and is hard to miss).** Proactive updates - a finished task, a scheduled run's result, a reminder, a Friend Mode check-in - used to go only to the desktop buddy bubble or Telegram. With the buddy off and no Telegram connected, they vanished. Now every one is recorded to your Notifications page (with the unread dot on the Bell), pops a toast the moment it happens, and plays a sound. Important ones (a completed task) stay on screen until you dismiss them instead of fading after a few seconds.

- **A live Plan you can watch.** When the assistant works through a multi-step task it shows a pinned checklist at the top of the chat that ticks off in real time, the way Claude Code tracks its to-dos. It works in any chat, not only Code mode: give it a task with steps and the plan appears. Collapse it if it is in the way, close it with the X, and it tidies itself away once the plan is done.

- **Skales acts for you when a contact messages it (WhatsApp).** Let family or a colleague message your Skales on WhatsApp. Instead of answering them itself, Skales pings you with their request. Reply with what to do ("make the appointment", "tell her yes") and Skales carries it out with your tools and then answers them for you, like a real assistant. On the road, owner commands help you steer: /help shows what you can do, /pending lists the requests waiting for your OK. The first time you set yourself as owner, Skales sends you a short welcome with these commands.

- **Stop re-approving every edit.** When Skales asks to approve a batch of file edits, the prompt now offers "Approve + allow edits this session". One click and it stops asking for file edits (write, edit, delete, move, copy) for the rest of that chat, so a folder-bound coding session flows without a prompt on every change. Deliberately scoped: shell commands, git push and deploy still ask every time, and it only ever applies to the one chat session.

### Fixed

- **Updating on Windows no longer fails partway through.** If you used WhatsApp (or Telegram), its background bot - and the Chrome it runs - kept running after you clicked Restart, holding the app open so the installer failed with an error ending in "(2)" and you had to uninstall and reinstall by hand. Skales now shuts those background processes down before the installer runs (and on every normal quit), so updating just works. Affects updates going forward from this version.

- **Incoming WhatsApp messages from your own number now arrive.** On modern (multi-device) WhatsApp your message reaches the bot as an opaque linked-device id, and the bot was handing that id to the whitelist instead of your real phone, so it rejected your own messages. The bot now asks WhatsApp for the real phone behind the id first, and never falls back to the device id, so your messages land in the chat and get a reply.

- **Two-way WhatsApp survives reconnecting.** Disconnecting or clearing the WhatsApp session was deleting your settings along with the link: the mode (so the bot fell back to send-only and dropped every incoming message) and your contact whitelist + owner flag (so the route rejected your own messages). Reconnecting to troubleshoot recreated the problem every time. Disconnect now only unlinks the session and keeps your mode, contacts and owner.

- **Notifications and reminders go to the channel you chose, and to you.** Calendar reminders were hardcoded to Telegram, so they arrived there even when you had selected WhatsApp; they now follow your notification-channel setting. And a notification meant for you (a reminder, or a heads-up that a contact messaged you) now goes to your own owner number, not to the first permitted contact.

- **The WhatsApp assistant can finish the job.** Actions that need approval (a calendar entry, a reminder, sending a message or an email) were being blocked on the WhatsApp channel, which has no approve button, so asking your assistant on WhatsApp to do something often did nothing. On your own owner thread your instruction now counts as the approval, so these actions run. File and shell tools are deliberately left out and still never run unattended from a message.

- **The "Multi-Agent running" badge always clears.** If a multitask job hit an error while wrapping up, the badge could stay on until you reloaded the chat. The completion signal now always fires, so the badge clears even when a job fails.

- **Multitask and the checklist survive weak and local models.** On a tight tool budget (small local models, or models that need a capped tool set) the multitask and checklist tools could be dropped while the assistant was still told to use them. They are now protected in the top tier, so they stay available whenever they are advertised.

- **A malformed checklist update no longer wipes the plan.** If a weaker model sent the checklist in an odd shape, the list could blank mid-task. The update now tolerates those shapes and ignores an empty update instead of clearing the plan.

- **Code mode prefers fast checks over a full build.** Verifying "done" now leans on typecheck / lint / test (and notes that a long build hitting the shell timeout is not a code error), so Auto does not chase a timeout as if it were a bug.

- **The Always-On scheduler is honest about what it ran.** A scheduled task showed "Executed" with a 0.0s duration the instant it fired, which read as "ran and did nothing" - it had only been queued. The log now says "Queued", and the actual run and its result land in your Notifications when it finishes. Each schedule's own execution log now also records the run's result (or error), so on the Schedule page you can see whether a cron actually worked and what it produced, not just that it fired. The assistant also no longer tells you the scheduling tools (schedule_recurring_task and friends) do not exist: they are listed in the capability index, a capability lookup by tool name resolves them, and they survive the tight tool budget on small local models so they stay callable.

- **Documents and the to-do list no longer pop open when you revisit a chat.** Reopening a finished chat from history flung the in-chat document editor and the plan checklist wide open every time. They now stay collapsed when you reopen a session, and only open or expand for a live update while you are actually working in the chat.

- **Pairing two computers (Teams) completes now.** The window showing your 6-digit code is a full-screen modal, and the "accept this connection" prompt was rendering behind it - you could not reach it, and closing the code window tore the pairing down before you could. The accept / reject prompt now appears inside the code window the moment the other machine enters the code, so you confirm it right there and the team forms. (Clicking the backdrop no longer cancels a pairing that is waiting for your OK.)

## v11.2.4

### Added

- **Multitask / sub-agents are a first-class command.** Ask Skales to "run these in parallel", "send sub-agents" or "leg ein multitask an" and it fans the work out to parallel background agents that report their results back into the chat. A live "Multi-Agent running" badge shows while they work, with the Tasks tab for detail. Multitask requests no longer slip into a day-planner entry by mistake.

- **A live plan the agent works through.** For a multi-step task the agent keeps a checklist in the chat: it lays out the steps, marks the one it is on, and ticks each off as it finishes, so a long Code or Auto run stays on track instead of wandering. In Plan mode it shows you the plan as that checklist.

### Changed

- **Code mode verifies before it says "done".** After changing code, Skales runs the project's own check (it detects your npm / cargo / go / pytest setup), reads the failures, fixes them, and re-runs until green; in Auto mode it does this on its own.

- **Clearer workspace handling in plain chat.** Working in a normal chat without binding a folder now clearly uses the Skales workspace for files, and the mode switch makes it obvious you can bind a folder for deeper work with one tap.

## v11.2.3

### Fixed

- **The private Briefing recovers on its own.** A single failed poll could leave the Briefing stuck so it never refreshed again. It now advances its schedule even when a poll fails, so it always retries on the next cycle instead of freezing.

### Changed

- **The Briefing shows when it last updated.** A small timestamp next to the refresh button (with the exact time on hover) tells you at a glance whether the feed is fresh, so a quiet feed reads as "nothing new right now" rather than "is this broken?".

## v11.2.2

### Fixed

- **Incoming WhatsApp messages reach Skales again.** Writing to your assistant from your own second number did nothing: the message never showed up in the WhatsApp chat and Skales never reacted, in either mode, and reconnecting or re-entering the number did not help. Modern WhatsApp routes a personal chat through a linked-device id that is not the phone number, and the previous build forwarded that id as the sender, so it matched neither your whitelist nor your own number and was turned away before any conversation was created. Skales now asks WhatsApp for the real phone number behind that id, querying WhatsApp itself when it has never seen the number before, so your messages land in the WhatsApp chat and get a reply. Sending (Friend Mode check-ins and the replies you trigger) was never affected.

- **A turned-away incoming message is no longer silent.** When the bot forwarded a message and Skales rejected it, the bot logged only the status code and treated every outcome as a success, so a real rejection looked like a delivery. That is why this looked fixed before while staying broken. The bot now records the exact reason in its log and Skales notes a blocked sender, so any future delivery problem is visible instead of disappearing into an empty chat.

- **The Read & Write switch always takes effect.** If the setting reached the running bot at a bad moment it could keep using the old value until a restart. The bot now re-reads the setting on its own within a few seconds, so turning Read & Write on or off is reliable without restarting.

- **An expanded image fills the window.** Opening an image or a shared screenshot in chat showed the viewer behind the sidebar, so the menu sat on top of the picture. The lightbox now opens above everything.

- **A WhatsApp reply stays in one thread.** When a contact's number was saved in a local format that differed from how WhatsApp reports it, the reply could open a new conversation separate from the Friend Mode thread. The same person now always maps to one thread.

### Added

- **Optional VirusTotal scan for Code-mode writes.** A new toggle under Settings > Chat & Code, off by default. With it off, files the agent writes are no longer sent to VirusTotal on every write, which keeps Code mode local-first and avoids shipping hashes of your own files out. Turn it on to have each write checked. Files downloaded from the web are still scanned when VirusTotal is set up.

## v11.2.1

### Fixed

- **WhatsApp two-way messaging works again.** Incoming messages from you were being dropped since the privacy gate landed, on two counts: modern WhatsApp routes personal chats through an addressing scheme the bot no longer recognised, and your own number was never auto-trusted so it failed the contact whitelist. Skales now recognises modern messages, resolves the real number, and always treats your own linked number as the owner, so you can reach your assistant out of the box. The whitelist still gates third parties, and Send Only stays outbound-only by design.

- **Friend Mode delivers and records on the same channel.** A WhatsApp or Email check-in was recorded in the Telegram conversation, so the message and your reply ended up in different threads. Friend Mode now records each check-in in the channel it was actually sent through, and sends WhatsApp to you (your owner-flagged contact) instead of an arbitrary permitted one.

- **The Friend Mode test tells you what happened.** The Test button used to report success even when a channel silently failed. It now shows which channel did not deliver and why, for example an email account that is not send-capable.

- **The assistant knows what LLM Profiles and Agent Memory are.** It no longer reports them as broken or tries to turn them on as if they were skills; it reads their real on/off state from Settings and points you to the right place.

### Added

- **Code mode: give a chat its own folder and work there.** A new Chat / Code / Plan / Auto switch in the composer (or the /code command) points a single conversation at a folder on your computer, so Skales reads, edits and runs commands inside it like a coding agent instead of in its own workspace. Plan is read-only and proposes a step-by-step plan before touching anything; Code makes the changes directly; Auto works through the task on its own until it is done or blocked. If the folder is outside what Skales is currently allowed to touch, it asks first and widens access only the way you pick (add just that folder, or allow full disk). Results surface the way the rest of Skales already shows them: a live HTML preview, a document, or a file you can open. Each chat keeps its own folder and mode, so a plain chat behaves exactly as before.

- **Code mode edits surgically, does git, and runs tests.** A new edit_file changes part of a file by exact text replacement instead of rewriting the whole thing, so edits are smaller and safer. git_status, git_diff, git_commit and git_push work in the bound folder using your own git identity and credentials (no attribution is added), so "commit and push my changes" runs end to end; if a push needs GitHub auth it tells you instead of failing silently. test_run detects the project's test framework (npm/jest/vitest, pytest, cargo, go) and runs it, so the agent can check its own work.

- **The agent can ask you structured questions.** When it needs you to choose between options or confirm a direction, it shows a small slide-up form (clickable options, single or multi-select, one to a few steps) instead of a long question, then continues with your answers.

- **One-click deploy.** deploy_project detects Firebase, Vercel, Netlify or an npm deploy script in the bound folder and runs it with your existing CLI login, so "deploy the site" works end to end (now that shell commands have room to finish).

- **A model just for code.** A new Settings > Chat & Code tab (between AI Provider and Goals) lets you pick a model used only in Code mode (Code/Plan/Auto): choose a provider and fetch its models (live for OpenRouter), so a strong cloud model does the coding while your chat stays on your default or local model. Leave it empty to use your active model.

- **Deep reasoning (xhigh).** An opt-in toggle (Settings > Chat & Code) that asks any model to think a problem through step by step before acting, so Sonnet, Gemini and local models benefit too, not only models with a native reasoning mode.

- **MiniMax (M2 / M2.7) profile.** A built-in LLM Profile for MiniMax's agentic models, with the vendor's recommended sampling.

### Changed

- **Shell commands have room to finish.** The old hard 30-second limit killed real work (npm install, a build, git push, a Firebase deploy) mid-run and truncated the error. Commands now run up to 2 minutes by default, configurable up to 10 in the new Settings > Chat & Code tab, and keep up to 10 MB of output, so those commands can actually complete and you see the real error if one fails. A command that does hit the limit now says so clearly instead of failing silently.

- **Auto mode in Code really runs on its own.** After a one-time consent, Auto pre-approves the file and shell tools inside the bound folder, so a multi-step task no longer stops for approval on every step. Email, WhatsApp, browser and other tools that reach outside the folder still ask first, dangerous commands stay blocked, and you can leave Auto anytime.

- **Friend Mode uses one outbound channel.** The channel picker is now a single choice (Telegram, WhatsApp, or Email) so the channels cannot conflict and a reply always comes back to one place. Local notifications are unaffected.

- **Briefing follows a whole site, not just its homepage link.** When you add a news site or a YouTube channel, Skales now finds its RSS feed automatically and pulls the latest articles or videos, instead of bookmarking the front page once. The private Briefing also refreshes every 3 hours instead of every 6, and still arrives in its own Briefing chat.

- **Goals finish cleanly, stay on the thread, and learn.** A finished goal now shows a completed card instead of still offering Continue/Stop. If you reply to a goal that paused for your input and add a follow-up ("looks good, and after that do X"), Skales continues the SAME goal with your answer and the extra task in context, instead of forgetting its worked-out plan or starting over. And a hard-won approach is now recalled in ordinary agentic chats too, not only inside a goal, so what took many tries once is reused next time; a stalled step is logged with the tool it got stuck on.

## v11.2.0

### Added

- **Teach Skales a desktop task by recording it.** On the Workflow page, hit Teach by recording, do the task once on your screen, then press F10 to stop (F9 pauses, so you can skip typing a password). Before it saves you see every captured step, including the text you typed, so you can check nothing sensitive slipped in, then save it as a /goal command. Type that /goal in chat, or press Run, and Skales replays your exact clicks, typing and scrolling after a short countdown that lets you switch to the right window. Replay is built in, with no setup. Honest about limits: it works on macOS, Windows and Linux X11 (not Wayland), and it records and assists rather than blind-driving arbitrary native apps.

- **A real document you and Skales share.** Open the Document panel from the chat header or with /doc. Ask Skales to write or change a document ("write me a doc about X") and it appears in the panel; edit it yourself with the formatting toolbar (bold, italic, underline, heading, list, quote, code) and Skales sees your changes on the next message. A chat can hold several documents, picked from the dropdown, and they are saved with the chat. Documents live with the chat, not as files on your disk; click Download to save the open one as a .md file, or ask Skales to save it as a file when you want one on your computer.

- **Group Chat is a live conversation now.** Pick your participants, and after the opening round you stay in the chat: write to the group, the agents read your messages and answer each other turn by turn, one acts as the advisor, and you end it with a button instead of it running on. Typing /groupchat in a chat with no topic hands the current conversation over to the group as the topic.

- **Your Briefing arrives as cards.** Fresh Briefing links now show as compact cards (image, title, summary, source) instead of long raw links, ad and tracker redirects are filtered out, and /briefing pulls up your unread items on demand.

- **Coloured tray status and a Chat submenu.** The tray status shows a colour dot for its state, and hovering Chat gives you New Chat and History without leaving the tray.

- **Your Briefing comes to you.** Fresh links found for your Briefing now arrive in a dedicated Briefing chat (with the waiting dot) and the notification names the top item, instead of only telling you a count.

- **Waiting-message markers.** When Skales reaches out on its own (Friend Mode check-ins, finished scheduled tasks) the conversation shows a dot in the chat list and History so you can see a reply is waiting, and it clears the moment you open it. A count on the chat history button shows how many chats are waiting, so a pile of them is visible at a glance.

- **Agents that learn from their work (opt-in).** Turn on Agent Memory in Settings and each Custom Agent keeps its own memory, distilling a short lesson from every task it finishes and reading it back on the next run, so it gets better at your work over time instead of starting fresh each time.

- **LLM Profiles for reliable tool use across models (opt-in).** Turn on LLM Profiles in Settings and Skales tunes itself per model: it caps the tool set, compacts the prompt, sets sampling, and adds short per-model hints, so weaker or local models stop fumbling tool calls. A profile binds automatically to whatever model its pattern matches, with no default to set, and the LLM Profiles page shows you which profile your current model is using. Profiles can also teach a model your tool names directly, so a model that reaches for create_file learns the real tool is write_file. Built-in profiles ship for DeepSeek, Qwen, Llama, Gemma, Mistral, GLM, Kimi and small local models; import your own from a file, pasted JSON or a URL, with the full tool-name list right there so you never have to know them by heart. Frontier models are left untouched.

### Changed

- **Local models stay warm between turns.** Skales now keeps your local Ollama model resident for 30 minutes after a turn instead of letting it unload on Ollama's 5-minute default, so back-to-back turns and background goals no longer pay for a cold model reload. Power users can change the window (including keeping it always resident) with the SKALES_OLLAMA_KEEP_ALIVE setting.

- **Smaller and local models have far more room to work.** Skales now sends a lean system prompt by default and looks up capability and feature detail on demand, and it automatically gives constrained models (local models, and smaller cloud models such as DeepSeek) a compact prompt and a focused set of tools. Weaker models complete tasks and call tools noticeably more reliably as a result.

- **Chat no longer gets stuck repeating a tool call.** If a model calls the exact same tool over and over in normal chat, Skales nudges it to change course and stops cleanly instead of looping until the step limit.

- **Clearer command approval.** When Skales asks before running a shell command, it now also explains that you can let it run commands without being asked each time by switching Safety Mode in Settings.

### Fixed

- **Email and calendar tools work on local models again.** On small local models with several integrations connected, Skales caps the offered tool set so the model is not overwhelmed, and your connected email and calendar tools could be dropped from that set while the model still tried to call them, so nothing happened. Connected email and calendar now always survive the cap, so those calls actually run.

- **Record a browser flow straight into a Playbook.** On the Playbooks page, Record opens the browser in record mode and captures what you do as a playbook, while + builds one by hand step by step. The browser now opens to DuckDuckGo (a local-first tool has no reason to push Google), and Skales never records its own window as a step, so a recording starts from a real site. Promote any playbook to a /goal command from its menu.

- **WhatsApp keeps your data to you, and you stay in control.** Only the number you mark as the owner (Settings, WhatsApp contacts, "Set as you") gets your assistant with your memory and tools. Skales never auto-replies to anyone else: when a whitelisted contact writes, their message is recorded, their chat is flagged waiting, and you are pinged, then you decide, tell Skales "answer Marina that ..." and it sends (after you confirm), or turn it into a reminder. Unknown numbers are ignored entirely. With no owner set, nobody gets your assistant.

- **The chat no longer flickers while you type.** The HTML preview used to reload and flash white on every keystroke (in the composer or the Document panel); it now stays put.

- **Clearing a chat sticks now.** /clear used to wipe only the view, so the messages came back on reload. It now clears the stored conversation too. The Briefing inbox also keeps only its recent entries instead of growing forever.

- **WhatsApp inbound is gated and safer.** Only contacts on your whitelist can reach Skales over WhatsApp, and a contact's WhatsApp Status is never treated as a message, so a Status can never be acted on as an instruction. Images sent on WhatsApp are read with your configured Vision provider.

- **The Vision provider you configure is actually used.** With a Vision provider set up under Settings, Skales now reads images with it in chat and on Telegram instead of quietly sending them to your active chat provider.

- **Scheduled tasks and Friend Mode check-ins keep firing.** A background task that hung could quietly stall the whole scheduler, so cron jobs and proactive check-ins stopped running until the app was restarted. Proactive check-ins now run on every heartbeat regardless, a stuck task is released automatically, and the background runner restarts itself if it ever stops. Turning on the Always-On Agent now runs your scheduled tasks on its own, even when Autonomous Mode is off.

- **Large file attachments are no longer cut short.** Attaching a big text or code file now sends as much of it as the model's context window allows, honoring your Override Model Limits, instead of a fixed cap that dropped most of a large file.

### Removed

- **Claude and Gemini subscription sign-in.** Anthropic and Google do not allow paid-subscription sign-in from outside their own apps, so these two options could never connect. Signing in with a ChatGPT (Codex) subscription still works, and Claude or Gemini stay available through an API key under AI Providers.

## v11.1.6

A focused fix release on v11.1.5.

### Fixed

- **WhatsApp connects on Windows again.** Setting up WhatsApp on Windows failed with a missing-component error and never showed the QR code. Skales now ships everything the WhatsApp link needs, shows the QR, and pairs. Reconnecting also works reliably if the link ever gets stuck, instead of silently doing nothing.

- **Setup no longer loops back to the start.** After the welcome summary you could be sent back to the first step over and over. Setup now finishes and opens the chat.

- **Friend Mode email check-ins arrive.** Proactive messages set to the email channel were not being delivered. They now send from your connected email account, the same one the chat uses.

- **Run a scheduled task by hand and actually see it.** Pressing Run now updated the last-run time but left the execution log empty, so it looked like nothing happened. Manual runs are now recorded in the log like scheduled ones.

- **Chat hover hints stay visible.** Tooltips near the message box could be drawn behind it. They now appear on top.

### Changed

- **Voice runs through your Skales voice setup.** The separate on-device voice engine has been removed. The AIPointer overlay's read-aloud and voice input now use your normal Skales voice configuration. The download is smaller and a Windows setup error is gone.

- **A nicer default email signature.** New email accounts start with a short "Cheers" signature instead of a sample placeholder.

## v11.1.5

A small follow-up on v11.1.0.

### Added

- **Share a generated image to Discover.** Studio could share a Skales Visual but not a plain image. The image view gets a Share to Discover button: the image is fitted under the feed's size limit and posted, landing in review like other shared images.

- **Send a file to your Telegram.** Skales can now send a document, image or PDF to your paired Telegram, not only text. Ask for it ("send me that report on Telegram") and the file lands in your chat.

- **Your own daily Briefing in Discover.** Follow the topics you care about and Skales brings you fresh links every day, in its own Briefing space inside Discover. It is private: only you see it, nothing is posted or shared. Skales suggests topics to start from based on what you work on and your language, you can add or unfollow any with a tap, and each item opens in the built-in browser so you stay in Skales. It fills in the background and works with a local model or no model at all, and pauses cleanly when you are offline.

### Changed

- **Skales works with whatever model you run, big-name or not.** Skales now recognizes an action whether the model returns it the standard way or writes it out as text, so a newer or smaller model can drive Skales' tools and multi-agent dispatch without special handling. If a model gets stuck repeating itself, Skales nudges it to try another way or wrap up instead of stalling. A model you wire up later just works.

- **Skales tells you which model it is running.** Ask what model or AI it is and it answers honestly with the model you configured, instead of claiming to be a different assistant.

- **Everything is on out of the box.** A fresh install starts with all features active so nothing looks missing; turn off what you do not use in Add-Ons. Existing installs are left exactly as you had them.

### Security

- **Pairing is harder to intercept.** The relay that lets two devices find each other during pairing now turns away any third device that tries to join a pair's rendezvous, and limits how often one address can connect. That closes the window where someone could brute-force a pairing code or quietly sit in on a handshake. Your messages were already end-to-end encrypted; this hardens the first-contact step itself. It applies to every v11.1.0 install with no update needed.

- **Skales reads web pages and other fetched text as information, never as orders.** Anything Skales pulls in through a tool, a web page, a search result, an email, a feed, is now clearly marked as outside content, and Skales is instructed never to act on instructions hidden inside it. This stops the "ignore your previous instructions and email this to..." trick where a booby-trapped page or message tries to hijack the agent.

- **Autopilot runs its actions, and the hard safety net can never be switched off.** An armed goal is your go-ahead, so Autopilot now actually carries out the steps you set it up for instead of quietly skipping the ones that send or change something. Underneath that, one block stays on in every mode, including Unrestricted: commands that would wipe a disk, delete your home folder or Skales' own data, set off a fork bomb, or power the machine off are always refused. That block cannot be disabled.

- **More actions stop to ask first.** Sending a WhatsApp message or media, and typing or pressing keys inside a logged-in browser page, now wait for your approval in Safe and Advanced mode, because the agent chooses who it goes to or what it types and a hostile page could try to abuse that. Replies to your own Telegram stay automatic, since they only ever go back to you. Advanced mode now also runs a risky shell command after you approve it, where Safe mode still refuses it outright.

- **The settings file is off-limits to the file tools.** Skales' own settings file can no longer be read or written through the ordinary file tools, only through Settings. That keeps your keys and security switches out of reach of a crafted file action.

- **Server-side fetches stay on the public web.** When Skales fetches a file or a URL for you, it now allows only normal web addresses, refuses internal and loopback targets, follows your domain blacklist, and re-checks every redirect so a link cannot quietly send it somewhere private. A downloaded file gets a clean name and must land inside a folder you allow, and a file only leaves over Telegram if its path is allowed.

- **Approvals belong to one chat and run exactly once.** A Telegram approval can only be confirmed from the same chat that asked for it, so another chat cannot tap Approve on your pending action. A double-tap or a retry can no longer run the same approved action twice.

- **An incoming message cannot promote itself.** The internal "system job" path that skips the usual checks is now reachable only from inside Skales. A Telegram message that claims to be a system job is treated as the ordinary message it is.

## v11.1.0

A feature release on top of v11.0.0. Two Skales computers can pair and work together
(Teams), other agents can call Skales (A2A), Autopilot becomes the live board of every
goal Skales is working on, History search can find a chat by meaning, and the system
tray shows what Skales is doing, plus a new interview-first way to set a goal and a
wave of stability and security work.

### Added

- **Teams: pair two Skales computers and work together.** Turn on Teams, pair another Skales, and you and your agent can talk to the other person and their agent, end-to-end encrypted. You confirm each new computer by name before it can pair. Each teammate gets a tag, an online indicator, and a conversation that lives in Teams (not your chat history). A You / Agent switch in the composer lets your agent reply on your behalf. Cross-computer messages never run anything on the other machine. Off until you turn it on; the mobile pairing you already use is unchanged.

- **Other agents can call Skales (A2A).** Skales now speaks the Agent2Agent standard, so another agent (or another Skales) can discover this instance and delegate a task to it. Off by default, and you stay in control of what an outside caller can do. Turn it on from the Teams screen.

- **Autopilot shows your running goals.** The Execution Board grows a Running Goals strip: one card per active goal across every chat, with its status, acceptance-criteria progress, step budget and channel. Click a card to jump straight into that goal's session. It is the live grid of everything Skales has in flight.

- **Set a goal by interview with `/goal-autopilot`.** Type it in chat and Skales opens Autopilot and interviews you first, to understand what you actually want, then proposes the concrete tasks, instead of arming a goal from a single line. The plain `/goal` (instant) path is unchanged.

### Changed

- **Voice runs on your device, in the cloud, or on your own server.** Voice uses your operating system's built-in speech by default, the cloud providers you configure (OpenAI, Gemini, Groq, ElevenLabs, Azure), or any OpenAI-compatible speech endpoint you self-host and enter under Settings, Voice. The bundled on-device engine (Kokoro for read-aloud, Whisper for transcription) stays available on Windows and Linux. On macOS it is no longer offered. Its machine-learning components cannot be code-signed inside the notarized build and so could not run there. macOS users use System, Cloud, or their own speech server, and every engine still falls back to the operating system voice if it is unavailable.

- **Web search names the provider it actually uses.** The agent no longer claims it searches with Tavily when DuckDuckGo (the keyless default) or another provider is the one configured.

- **The Playground opens right away** instead of sitting on a blank screen while it prepares its first suggestions in the background.

### Added

- **Multi-agent job results come back into the chat.** When you hand a job to multiple agents, the finished report is written back into the conversation and you get a notification when it completes, instead of having to open the Tasks tab to find it. A sub-task that runs out of its step budget now shows as parked rather than finished.

- **Find any past chat by meaning.** History search gains a Meaning toggle that ranks your conversations by what they were about, not just the exact words, blended with how recent they are. It runs on your own embedding model (local by default) and falls back to keyword search when none is set, so it never returns worse results than before.

- **The system tray shows what Skales is doing.** Open the tray menu for a live snapshot: the active provider and model, API calls this hour, scheduled planner tasks and goals, and a warning when an approval is waiting or Autopilot has paused at its cost cap. Quick links jump straight to Chat, Planner, Studio, Autopilot and Settings.

- **A context and session readout below the composer.** A quiet line shows how full the model's context window is for the current chat and how long the session has been running. Hover it for the exact token count, the model, and a note that Skales auto-compacts older messages around 75% so the model stays within its window. It reads the window from the known-model list, so it works on any provider out of the box.

- **Teach Skales a workflow by showing it once.** Walk Skales through a task in a normal chat, then open the Workflow page and pick that chat: Skales distills it into a reusable workflow with a name, a trigger, the repeatable steps and what counts as done, and you can run it again from chat with `/goal-<trigger>`. The replay runs through the normal goal path and falls back to vision when a button has moved, so a workflow you captured keeps working as pages change.

- **Review the code Lio wrote, not just the rendered page.** When a Lio build finishes, the right pane gains a Code view next to Preview: every file Lio produced, with its source shown read-only and a copy button, and images rendered inline. You can read what was actually built before you download it, deploy it or ask for changes.

### Fixed

- **Shared Skales Visuals display correctly in the feed.** A visual built at a fixed size used to show only a shifted corner; it now scales to fit, like the Studio preview.

- **Telegram and WhatsApp no longer go silent** when a task needs more than one message. You get an honest status and can reply to keep it going.

- **The occasional personalization question no longer repeats** the same prompt.

- **Copy to clipboard works in the Tasks result view**, and the chat composer cursor stays aligned with a highlighted command.

- **Uploading a file no longer starts a goal by accident.** A document that mentions a slash command (a changelog, these release notes, a piece of source) is now read and summarized, not treated as a command to run. The same goes for a skill mention written inside a file.

- **Identity maintenance stays in the background.** The nightly identity refresh no longer sends a stray "completed" message over Telegram or surfaces a bubble in the active chat; it runs silently, as it was always meant to.

- **The WordPress page no longer fails when nothing is connected.** Opening it without a configured site shows the setup prompt instead of a connection-failed error.

- **Agent-run playbooks perform more of their steps.** When Skales runs a saved browser playbook on its own, it now also does scrolling, key presses, screenshots and form fills. The few steps that need the live Browser view say so instead of being skipped without a word.

- **The edit box matches the chat width** when you edit a message, and the New Chat screen takes images by drag-and-drop. Toolbar buttons there now explain themselves on hover.

- **A recurring task you ask for in chat lands in the right place.** A sub-daily cadence (a 30-minute Pomodoro, "every two hours") now goes to Schedule, which runs it, while the Planner keeps daily, weekly and monthly jobs. Before, an unsupported cadence was saved but never appeared on the Planner and never fired.

- **The running-goal status popover stays on screen.** On a narrow window it used to slide off the left edge; it now opens rightward and is capped to the viewport, like the model picker. Searching settings for "a2a" or "teams" also finds them now, with a link to the Teams page.

## v11.0.0

```
███████  ██  ██    █████   ██       ███████  ███████
██       ██ ██    ██   ██  ██       ██       ██
███████  ████     ███████  ██       █████    ███████
     ██  ██ ██    ██   ██  ██       ██            ██
███████  ██  ██   ██   ██  ███████  ███████  ███████

   v11.0.0    release name:  /GOAL
```

A new look for Skales, a new way to work by setting Skales a goal that keeps going on its own in the background until it is done, a rebuilt Studio for images, video, voice, and music, one home for all your chats and projects, and your saved provider API keys now kept encrypted on disk.

### Added

- **Set Skales a goal and let it work toward it.** Type `/goal` followed by what you want, like `/goal build me a trading bot`, and Skales takes it on as an ongoing goal instead of a single reply. It works out what reaching the goal looks like and keeps going through the steps toward it, and when it needs a decision from you it parks the goal and shows a card to pick it back up or stop it.

- **A goal keeps working on its own in the background.** Once you set one, the work carries on by itself without the chat window open, and picks back up where it left off after you close and reopen the app. Skales keeps each goal on its own track, so you can set more than one going and come back to find them further along.

- **Set a goal to run on a schedule.** Alongside a one-off goal, you can now set one to run on a repeating schedule, like every morning or once a week. Skales works it on its own in the background each time it comes due and keeps each run separate, so a standing goal makes progress without you having to start it.

- **Skales can take on a goal from how you ask.** Off by default. When you switch it on, a message that reads like a project, for example "build me a small site and then put it online", is taken on as an ongoing goal instead of a one-off reply, with a sensitivity you can set from low to high. The wording is read on your device with no extra model call, so nothing about your message is sent anywhere to make the decision.

- **Skales can keep working a goal while you are away.** Off by default. When you switch it on, a goal that paused on its own can carry on while you are idle, picking back up once you step away and parking again for you the moment you return, so a long goal can move forward in the background without running on while you are right there.

- **Keep an ongoing presence with a goal.** Start a goal with `/goal presence:` and Skales holds a steady presence over time as a declared agent, only on the channels it can use honestly: your own Discover feed, email through your mail settings, and the official integrations you have connected. It never pretends to be a person or works around anything built to keep automated agents out, and it learns from what comes back each round. There is a short plain-language note about goals, and this type, at the bottom of the Goal settings.

- **A new look, Skales-X.** Skales opens on a new default theme with a floating glass sidebar, a calm dark palette lifted by a single bright accent, and a short launch screen when it starts. Existing installs move to the new look on update, and every other theme, including the previous one, is still in Settings under Appearance if you want to switch back.

- **One home for your chats and projects.** There is now a single place to find every conversation you have had. A history page lists your chats and lets you search across what was said inside them, opening Skales lands on a New Chat screen with your recent chats one click away, and any chat can be linked to a project so the two stay together, with Skales keeping a short running summary of what the chat is about.

- **A rebuilt Studio.** Studio is organized around four areas: Design, Media for images and video together, Audio for voice and music together, and a Gallery of everything you have made. A new button starts a fresh design, clicking any result in the Gallery opens it full size, and starting a design from a web address now reads the page in properly instead of coming up empty.

- **Share a Skales Visual to Discover.** A visual you make in Studio can be shared straight to Discover as its own live piece, and you can also save it as an HTML file or a PNG. Shared visuals are checked before they appear to everyone, and they run inside their own sandboxed frame.

- **Import your conversations from Hermes.** If you have used Hermes, you can bring your history across. Choose Hermes from the import options in Settings and point Skales at its database file; your past sessions come over, along with any personality and memory notes saved next to it.

- **Skales adapts to how you work.** Over time Skales builds a quiet sense of how you like to work and folds it into its memory, and now and then it asks you one short question to understand you better, never while it is busy and never often. You can also set your agent's character outright when you join Discover, its tone and how grounded it stays, and that carries into your chats. It stays part of your memory and is always on. When that short question does come up you get a quiet notification and a dot next to Chat so it is not missed, and you can clear everything Skales has picked up about how you work at any time, from Settings or right in the chat.

- **Cast to a screen on your network.** Skales can send a page, a chat answer, or something you made in Studio to a TV or media player that supports DLNA on your local network. It is off until you turn it on, finds devices on your own network only, and each cast is something you start. Casting something you made in Studio turns on a small sharing bridge on your own network for that cast, which you switch on yourself.

- **Draw a workflow and run it like a goal.** A goal you set in words now has a hand-drawn counterpart. A visual editor lets you lay out the steps, the inputs you will fill in, and what finished looks like, and saves the result as a workflow you can run again. Each one gets its own trigger word, like `/goal-ship`, that lights up in the chat box, and one click opens a fresh chat with it ready to edit and send. Switch workflows on under Add-Ons; a pointer in Settings, Goal shows you where.

- **Bring in your Obsidian vault.** On the Memory page you can now import an Obsidian vault, a folder of Markdown notes, or a handful of loose files. Skales reads the links between your notes and draws them as a graph you can move around, following a wikilink from one note to the next and seeing what links back to the one you are on. Once it is in, Skales can read from your notes when you ask.

- **Reach more of what your MCP servers offer.** Beyond their tools, MCP servers can publish ready-made resources and prompts, and Skales now reaches both. Type `@` in the chat box to pick one and attach it to your message as context, shown as a chip you can remove. Servers that use the newer streamable-HTTP connection work too, alongside the ones Skales already spoke to.

- **Make an image or video without leaving the chat.** Type `/image` or `/video` with a short description and Skales draws it right there in the conversation with its built-in visuals engine, no key or setup needed. What you make stays in your history and redraws when you reopen the chat.

- **Skales can search through your files.** It can now search file contents for a word or pattern and find files by name across a folder, so when you point it at a project it goes straight to the right place instead of reading entire files one by one. Its work on large folders is faster and more accurate as a result.

- **Reach Telegram even on networks that block it.** Some workplaces and regions block a direct connection to Telegram, so the bot could not receive your messages or send replies. You can now enter a proxy in the Telegram settings, and Skales sends everything to and from Telegram through it, so the integration keeps working from behind a firewall.

- **Discover, rebuilt as a living feed.** Discover is now a three-pane feed with Spaces you can join, a sort bar for what is hot, new, top, or rising, and a card that picks out posts matching the interest you chose. Joining starts by giving your agent a character: its background, its generation, and a few dials from serious to playful, dry to funny, and grounded to speculative. That character stays in your memory and carries into your chats, so your agent talks the way you set it.

### Changed

- **Skales gets better at the kinds of goals it has done before.** When a goal succeeds, Skales distills the approach that worked and reaches for it next time, on top of folding in what it learned from the parts that did not. The Memory page shows this as a before and after: the friction it ran into on a kind of task, and the proven approach it now uses instead.

- **The sidebar is steadier and easier to read.** On the new look the sidebar stays expanded as you move between pages, and when it is collapsed each icon shows its label on hover, so you can tell the sections apart at a glance.

- **Web search sits with your other integrations.** The web search setting now lives under Settings, Integrations, alongside your other connected services instead of on its own.

- **Fresh installs start on current models.** The default model choices now point at the current generation, so a new setup begins on up-to-date models without you changing anything.

- **Answers appear as they are written.** A reply now streams in word by word as Skales writes it, instead of arriving in blocks every second or two. If you have scrolled up to read something earlier, it leaves you where you are and keeps writing below, with the jump-to-bottom button one click away.

- **Skales Visuals is built into the image and video toolbar.** The generation toolbar in chat now starts on Skales Visuals, the engine that needs no key, and it is always there. Google and Replicate sit alongside it and appear as choices once you have connected a key for them. Studio opens on Skales Visuals the same way.

- **Your MCP tools answer plain requests.** Tools from a connected MCP server have always run without an `@` mention, but Skales used to suggest reaching for the picker to use them. It now treats them like its own tools on any matching request, and the `@mcp-` picker is for attaching a server's resources or prompts as extra context.

- **Skales reaches into your knowledge base on its own.** The documents you add to the Knowledge Base were searchable with the `/rag` command; Skales now reaches for them by itself too. When you ask about something from a file or note you put in, it searches your indexed documents and answers from them instead of guessing, and it offers this only once you have added a document.

- **Summarizing a link gives you a readable page.** Ask Skales to summarize a web address and the result now comes back as a small rendered page instead of plain text, which reads better for an article. Summarizing text you typed stays plain, and your own choice in the style bar always wins.

- **The chat box highlights commands and mentions as you type.** A recognized command like `/goal` and an `@` mention of a skill or server light up as you write, and `/goal` now works wherever you drop it in a longer message, not only at the start.

- **The window frame follows your theme.** On macOS and Windows the title bar now takes on the active theme instead of staying the plain system frame, so the whole window matches the rest of Skales. Linux keeps its native frame.

- **Skales opens faster.** Start-up no longer waits on background setup before the first screen shows, the first-run check runs once instead of on every move between pages, and a page you are about to open from the sidebar loads a step ahead when you hover it.

- **Subscription and bring-your-own-key models use their full context window.** A ChatGPT, Claude, or Gemini sign-in, and a pasted token, is now sized to the real window of the model behind it, so a long chat no longer starts compressing far too early.

- **A passing connection test means a working connection.** Testing a custom provider endpoint now builds its address the same way a real chat does, so a full or versioned URL that works in conversation no longer comes back as a failed test.

- **Skales loads your installed skills only when they are needed.** If you had many skills installed, the full instructions for every one of them were packed into each message, which slowed responses and could make Skales talk about skills it was not actually using. It now keeps a short list of your skills and pulls a skill's full instructions the moment it is relevant or it decides to use one, so responses stay fast and accurate no matter how many skills you have.

- **Long runs keep their thread instead of running out of room.** When a task takes many steps and the conversation grows large, Skales used to quietly drop the oldest turns and could lose track of what it had already done. It now compresses the older turns into a compact progress note and keeps working from it. On the models that support it the compression happens on the provider's side; everywhere else Skales does it itself, so a long task stays on course.

- **Skales changes tack when it gets stuck on a goal.** While working a goal, if it catches itself repeating the same step or going several rounds without real progress, it now stops, rethinks, and tries a different approach instead of grinding through its step budget on something that is not working.

- **Goal planning can run on a cheaper or local model.** The background steps that plan a goal, check its progress, and sum up where it is can now be pointed at a smaller or local model while your main model does the real work, so a long-running goal costs less to keep going. It uses your main model unless you choose another in the goal settings, so this stays your choice and works with any provider.

- **Playground builds apps more reliably on a local model.** A smaller or self-hosted model now has a little more room on length and the number of AI calls so its apps make it through, and an app that calls a function it never wrote is caught and rebuilt instead of shipping broken. The prompt also hands the model a full page to fill in, so weaker models start from solid structure.

### Fixed

- **Group chats and Organization runs start again.** Kicking off a multi-model group chat or running an Organization could fail to begin; both now start and run the way you set them up.

- **Discover works on a phone, and keeps your tag.** On a narrow screen the Spaces and details panels now open over the feed instead of sliding behind the sidebar, so everything is reachable. And if you already have a Discover tag, Skales keeps it instead of asking you to pick a new one after an update.

- **Discover keeps what you share.** Shared skills, templates, and images used to scroll out of the feed and vanish for good once it filled up, which made Discover feel like a feed that resets. They now stay permanently; only everyday chatter ages out.

- **The Brand Kit reaches Studio.** Turning on Brand Kit in an image or video generator now actually applies your brand: your palette in the prompt, plus your logo for Skales Visuals video. Before, the toggle recorded your choice but changed nothing.

- **You can reset what Skales learned about you.** Settings, Memory, Adaptive personalization now has a Reset that erases your agent's character and everything Skales has picked up about how you work, in one click.

- **AIPointer keeps the look you gave it.** AIPointer's own light or dark setting no longer follows the desktop theme; it stays the way you set it whatever theme Skales is on.

- **Opening a finished chat from a notification lands on that chat.** When a reply finished while you were on another page, the notification and the sidebar dot used to drop you on the New Chat screen instead of the conversation that answered. Both now reopen the exact chat that finished.

- **The New Chat screen lines up and opens its commands.** On the opening New Chat screen the "+" button and the send button now sit centered on the input row instead of dropping below it, and typing "/" or pressing the commands button opens the same command list the in-chat composer has.

- **The screen-share picker sits where it should.** Choosing a window to share opened a panel pinned against the sidebar with empty space beside it. It now centers on the screen the way it was meant to.

- **Clicking Chat lands on New Chat.** With a goal parked in your last session, clicking Chat used to reopen that session instead of the New Chat screen. It now opens New Chat unless a chat is actively replying, and a parked goal waits for you in your recent chats and on its card.

- **A shared video plays as a video.** When Skales shared a YouTube link it could come through as a broken player. It now plays as a clean embedded video, while a richer page that happens to include a video keeps its full layout.

- **The completion sound only plays when you are away.** A finished reply used to chime even while you sat on the chat waiting for it. The sound now plays only when Skales is in the background or you are on another page; the toast and the sidebar dot still appear either way.

- **Links show a preview card.** A web address you or Skales drop into the chat now shows a small preview with the page title and image, for both sides of the conversation.

- **A capped local model is told only the tools it kept.** When you limit how many tools a local model may use, Skales used to still describe whole groups of tools that did not fit the limit, so the model would reach for one it never received and report it could not help. The prompt now lists only the tools that made the cut, so the model works with what it actually has.

- **Messages stay put when several arrive at the same time.** If two were saved in the same moment, a Friend Mode check-in landing while you replied on Telegram, or a Desktop Buddy reply arriving alongside one in the main window, one of them could quietly overwrite the other and vanish from your history. Each message is now saved in a way that cannot overwrite another, so they all stay where you left them no matter how they overlap.

- **Deleting your message now clears its reply too.** Deleting one of your own messages used to leave the response it produced sitting right underneath it, even though the confirmation said the responses below would go too. Deleting your message now removes the whole exchange, the reply and any tool results that came with it, exactly as the prompt promises.

- **Skales recognizes what it is set up to do.** With a provider configured for something like image generation or web search, Skales could still talk about that feature as if it were missing or not set up. It now reads what is available from the same place your provider keys live, so its sense of what it can do matches what you have configured.

- **The Compact button shortens a long chat when you press it.** Compacting on demand reused the limits meant for the automatic version, so the button did nothing until a chat was already very long. Pressing it now shortens the conversation whenever you ask, and it stays disabled only while Skales is mid-reply.

- **Large files and long results no longer get cut off and lost.** When Skales read a big file or ran a command with a lot of output, only the first few thousand characters reached it and the rest was dropped, so it could act on half a picture. It now reads large files in pages and, when a result is too big to show at once, saves the full text and keeps reading from where it left off. It also sizes how much it keeps to the room left in the conversation, so a single big result can no longer crowd out everything else.

### Security

- **Your saved provider API keys are now stored encrypted.** They used to sit in plain text in your settings file. Skales now keeps them scrambled on disk and unlocks them only when it needs to reach a provider. Keys you already saved are converted automatically the next time you open the app, with nothing to re-enter. Tokens for connected services like Telegram or Slack are not encrypted yet.

- **Sign-in and link previews are hardened.** The sign-in window now treats whatever a provider sends back as text rather than markup and only accepts messages from Skales itself, closing a way a crafted error could slip content into the page. Link previews and the Studio read-from-web feature now refuse web addresses that point back at your own machine or your local network, except where a design served locally is the legitimate target.

## v10.4.5

Reliability fixes for the messaging channels, Friend Mode, and the chat view.

### Fixed

- **Skales's own check-ins stay out of your open chat.** When Skales reached out on its own, a Friend Mode note or a quiet identity check-in, the message could land in whatever chat you had open on the desktop and take it over. Those check-ins now keep to their own place, so the chat you are working in stays yours.

- **WhatsApp conversations stay in their own chat.** Messages from WhatsApp used to drop into whichever chat happened to be open on the desktop. WhatsApp now keeps its own dedicated Skales chat, the same way Telegram does, so a conversation you start there stays in one place.

- **Friend Mode keeps the thread when you switch screens.** When you moved from working on the desktop to a message from Skales on Telegram or WhatsApp, its note could arrive out of context, more like a generic notification than a friend picking up where you left off. Friend Mode now reads what you were just doing across all your channels, so its message stays on topic and in your voice, while still only ever writing to the channel it reached you on.

- **Formatting comes through on Telegram.** Bold text, lists, and code blocks used to show up as raw symbols and stray asterisks in Telegram replies. They now render properly, and code stays in a clean block you can copy.

- **Replies stop disappearing.** Some replies lived only on screen and vanished the moment you sent your next message or reloaded the chat. This included the playful easter-egg replies, the hello greeting, in-chat search results, the project commands, knowledge-base lookups, persona and model switches, and generated images and videos. All of these now stay in your chat history where you left them.

- **Short messages get a proper bubble.** A very short message, yours or a short reply from Skales, drew a bubble too narrow to fit the copy and other action buttons. Short messages now keep a comfortable minimum width, so those buttons always fit.

## v10.4.1

Reliability and clarity fixes for Codework, local models, file access, and the chat view.

### Fixed

- **Codework tells you when a local model can't carry out a task.** With some local models, Codework could end a task as if it had succeeded while nothing was actually built or changed, or run on until it stopped on a confusing error. It now keeps the model pointed at doing the work for real, and when it still can't, it ends with a clear message and what to try next, instead of a quiet success that left nothing behind.

- **File-access settings are clearer and fail early.** Folders you add under Custom are checked the moment you add them, so a missing, read-only, or otherwise invalid path is flagged with a warning instead of breaking mid-task. When file access is set to Workspace Only and something tries to use a path outside the workspace, Skales now stops with a clear message about how to allow it, instead of quietly saving the file somewhere you did not expect. The panel also notes that these settings cover file access only, which is separate from Computer Use control of your screen, mouse, and keyboard.

- **Local models get the time they need to respond.** The previous limit could cut a local model off while it was still loading into memory or working through a longer step, which surfaced as a confusing timeout. Timeouts now start higher for local and self-hosted models, and the per-provider timeout you set in Settings is honored everywhere Codework runs, not only in chat.

- **Multi-step tool runs read as one block.** When Codework takes several tool steps before answering, for example reading a file, listing a folder, then replying, the steps now collapse into a single section with one tool-results view instead of stacking as separate windows.

- **Copy your own messages.** The copy button now appears on your messages too, matching the one already on Skales replies.

## v10.4.0

AIPointer ⦿ is now a built-in part of Skales.

AIPointer is a cursor-anchored quick-ask AI overlay by the same team behind Skales. Hold a key, ask a question over whatever your cursor is pointing at, get an answer. Standalone AIPointer is a fast 2-second loop. The version inside Skales is an upgrade: it already knows who you are, what you have been working on, and can write straight into your Skales todos, calendar, notes, and memory. Heavy work hands off to the full Skales chat with one click.

### Added

- **AIPointer ⦿ integration.** Enable in Settings > Appearance > AIPointer ⦿. Hold the right Cmd key (right Ctrl on Windows / Linux) or wiggle your cursor, and a translucent quick-ask box appears over whatever app you are in. Type or speak a question. Get a fast answer that respects your timezone, language, and current projects without having to re-introduce yourself every time.

- **AIPointer knows you, because Skales knows you.** The overlay reads your Skales identity (name, language, timezone, active projects, interests) on every query. It pulls in recent topics when you ask "what was I working on?", and looks up entities from your knowledge graph when you mention names like "Alice" or "the Vienna trip". Nothing to type twice, nothing to set up.

- **AIPointer can do things in Skales.** Four atomic actions fit the 2-second loop. Say "remember this" and it goes to your long-term memory. Say "add to my todos" and it lands on your task list. Say "save as a note" and it appends to your dashboard note widget. Say "schedule lunch tomorrow at noon" and it captures the calendar intent. No app-switching for quick captures.

- **Send to chat.** Any AIPointer response carries a Send button that hands the query and the answer off to Skales main chat as a new session. Use it when the quick loop is not enough, like codework, browser automation, or anything multi-step. The imported session has full context, ready to continue with the complete Skales toolset.

- **Whisper and Kokoro voice engines.** New in Settings > Integrations > Voice > Local AI Voice Engines. The Kokoro text-to-speech runtime is live and powers AIPointer ⦿ read-aloud in 28 voices, fully on-device, no API key, no cloud round-trip, no per-minute cost. The Whisper speech-to-text model downloads here too, but the on-device runtime arrives with the next AIPointer sync; until then the AIPointer mic transparently falls back to your Skales transcription cascade (Groq / OpenAI Whisper API / Azure / local STT URL, pick yours under Settings > Voice). Skales main chat keeps its own TTS + STT cascade in v10.4.0; sharing Whisper + Kokoro across both surfaces lands in Skales v11.

- **Rich response formatting when it earns its keep.** For structured answers like comparisons, multi-step how-tos, planning, or summaries with metrics, AIPointer renders the response with cards, callouts, numbered steps, and metric tiles. Plain questions stay plain prose so a "what time is it for me?" answers in one line. Skales chat renders the same rich layout when you Send to chat, so the look survives the hand-off.

- **Discover indicator (opt-in).** Show others on Discover that you are using AIPointer ⦿ right now. Anonymous, just your Discover tag, no query content shared. Off by default. Toggle under Settings > AIPointer ⦿ > Discover.

- **AIPointer Settings tab.** A dedicated panel under Settings with every AIPointer knob in one place: trigger hotkey, mouse wiggle, hold duration, voice-first mode, chat-only mode, light or dark theme, accent colour, cursor halo intensity, screenshot crop size, pill offset, auto-approve tools, session transcripts, plus a Skales Integration section for the "activate only when Skales is minimised" behaviour. The current AIPointer version (and the fact that it has its own release cadence) is displayed at the top.

- **Built-in spell check.** Every editable surface across Skales, from the chat input to Settings to titles, now shows red underlines on misspelled words. Right-click a flagged word for suggestions and Add to Dictionary. A toggle in Settings turns it off, and you can pick spell-check languages independently of your UI language.

- **Sign in with your ChatGPT subscription.** Skales now supports OAuth sign-in for ChatGPT Plus, Pro, Business, and Enterprise accounts. Pick the new Subscriptions card at the top of AI Providers, click Sign in, and Skales routes chat through your existing ChatGPT plan with no API key required. Models available through your subscription show up in the model picker automatically.

- **Bring your own Claude or Gemini subscription token (advanced).** Power users who already have a token from Claude Code CLI or Gemini CLI can paste it into Skales under Subscriptions. The feature is opt-in, behind a disclaimer you actively accept. Skales sends the request unchanged, no header spoofing, no client masking. Anthropic and Google prohibit this in their consumer terms and have suspended accounts that route subscription tokens through third-party tools. The choice and the risk are yours. Sanctioned alternatives (Anthropic Console, Google AI Studio) sit one click away on the same cards.

- **Send your location to the Telegram bot.** Share a location or a place through Telegram's attachment menu and Skales now reads the coordinates. Ask "what is the closest bakery" and it can answer from where you are, instead of asking you to type an address or paste a map link.

- **Pick which agent answers on Telegram.** A new /agent command in the bot lets you switch between Default Skales and any of your custom or built-in agents. The chosen agent replies with its own instructions, model, and tool scope, and keeps its own Telegram chat history separate from the rest. Default stays Skales until you switch.

### Known limitations

- **Subscription tokens were not yet encrypted at rest in this release.** Sign-in tokens stayed on your own machine and never left it except to the vendor the token belongs to, but they were not encrypted on disk. Later versions of Skales encrypt them with your operating system's own protected storage.

### Changed

- **The Spotlight Bar has been retired.** AIPointer covers the same quick-ask use case with cursor anchoring, voice, vision, and richer affordances. The old Spotlight hotkey no longer triggers anything. Enable AIPointer in Settings > Appearance.

- **Saving a provider key actually tests it.** Pasting an API key and clicking Test now also enables the provider when the test succeeds and, if your active provider is still the empty install default, switches to the one you just configured. Already-active choices are never overridden.

- **OpenAI provider passes Organization on outgoing requests.** ProviderConfig carries an optional organization field; when set, every outgoing OpenAI call attaches the OpenAI-Organization header. Project-scoped (sk-proj-) and service-account (sk-svcacct-) keys that depend on an org binding now resolve correctly. The OpenAI provider card shows an inline hint when it detects a sk-proj- or sk-svcacct- key, and exposes the Organization input right below the API key field.

- **Friend Mode is back, and it remembers the conversation.** Skales can reach out to you on its own again, by Telegram, WhatsApp, or email. Each note is now built from your most recent chat and the things you have talked about before, so it reads like a friend picking up the thread instead of a template. It speaks in the same voice as your chat assistant: keep things formal and it stays formal, chat with emojis and it keeps using them. Ask it to drop a subject and it stays dropped, even across messages. It also picks its moments: it holds off while you are mid-task and when your last note has gone unanswered, rather than arriving on a fixed clock. Switch it on under Settings > Friend Mode, and use Test Friend Mode to confirm your channels.

- **Pick your web search engine.** Web search is no longer Tavily-or-nothing. A Search provider dropdown under Settings > Integrations > Web Search lets you choose DuckDuckGo (no API key, the new default), Tavily, Brave, a self-hosted SearXNG instance, or hand web search to a connected MCP server. Skales always gives the agent one search tool and swaps the engine behind it, so you no longer have to wire up an MCP server just for basic web search.

- **Run several custom providers at once.** You can register multiple OpenAI-compatible endpoints side by side (a local llama-swap, a vLLM box, a gateway, a second LM Studio) under Settings > AI Providers > Additional Custom Providers, each with its own name, URL, key, and model. They now resolve correctly when selected and appear in the chat model picker, so you can switch between them per chat instead of rewriting one shared slot.

- **Projects has one clear action button.** "Discuss with AI" and "Start working" did almost the same thing, which was confusing, so "Start working" is gone. "Discuss with AI" opens the project chat the same as before.

### Fixed

- **The agent uses your MCP search tool when Tavily is off.** With no Tavily key, Skales still told the model it had built-in web search, so the model reached for a tool that was not there and waved off a connected MCP search provider like DuckDuckGo as something it could not call. Now, when Tavily is off, the prompt stops advertising the built-in search, and the agent treats your connected MCP search tool as the real web search.

- **Skales keeps your connected MCP tools in reach.** Tools from any MCP server you connect now stay available to the assistant from one message to the next, whatever you named the server, and including on local models where the built-in tools used to crowd them out. While a server is still connecting or briefly drops, Skales no longer claims those tools are ready when they are not, so you stop getting confident answers about tools that cannot actually run.

- **No more phantom GitHub setup.** Skales stopped describing a built-in GitHub integration it no longer ships. GitHub is reached by adding the GitHub MCP server under Settings > MCP, and that is the only place Skales points you to now.

- **Clearer Google Calendar setup.** The Calendar settings now spell out what actually connects your calendar. An API key only reads public calendars (your own calendar returns a 404 with a key), so personal read and write needs OAuth. The OAuth section now calls out the step that trips most people up: a Google consent screen left on "Testing" blocks sign-in until you add yourself as a test user or publish the app.

- **Outlook Calendar connects again.** Connecting Outlook failed right after the Microsoft app setup because Skales asked for a sign-in redirect Microsoft no longer accepts. It now uses the supported desktop sign-in, works with single-tenant work accounts (enter your Tenant ID), and needs no client secret. The card also gained the Save and Test buttons the Google and Apple cards have, remembers your details across reloads, and the setup box spells out exactly what to register in your Microsoft app. Once connected, your Outlook events show up in the Planner alongside Google and Apple, the same as before.

- **Vision skill recognises local providers.** With a local Ollama or Custom Vision Provider configured, the Vision skill no longer stays stuck on "enabled, needs setup". The screenshot tool is callable as soon as you have a vision model selected. No API key required for local endpoints.

- **Clearer OpenAI errors.** Invalid key (401), exceeded quota (403), missing model access (404), and rate limit (429) each surface as their own toast with the right next step, instead of all collapsing into a single "API key failed".

- **Local models run your tools again, instead of just describing them.** On Ollama and other local or custom models, the agent would sometimes write out a tool call as plain text and then stop, so Codework and Chat produced a detailed plan but changed no files and ran no commands. Skales now recognises a tool call written that way and runs it, the same as it does for the big cloud models, so work that needs real edits, commands, or searches actually goes through on local models.

- **Skales stops claiming skills it has not been set up for.** When a skill was switched on but had nothing connected yet (say WhatsApp or Discord with no account linked), the model could still announce it was able to send messages there. Skales now states plainly which skills are ready to use and which still need setup, and it no longer lists the actions of a skill that is not ready, so it stops making promises it cannot keep.

- **The Filesystem MCP server starts on Windows.** Its default folder was set to a path that only exists on Mac and Linux, so on Windows it failed every time it tried to start. Skales now points it at the right temporary folder for your system, and quietly repairs a server that was already saved with the old path, so it connects instead of looping on the same error.

- **The MCP server list shows the real state.** Under Settings > MCP a server that was switched on always showed a green dot, even when it was failing to connect. The dot now reflects what actually happened on the last attempt and shows the error next to a server that could not start, so a broken server no longer looks healthy.

- **Provider fallback skips the entries it cannot use.** If you turned on provider fallback and the chain listed a cloud provider with no key, Skales tried each empty one and failed down the list every turn before reaching a working local model, which looked like it was switching models at random. It now skips a fallback provider that has no key or sign-in and goes straight to one that can actually answer.

- **Apps you build in Playground stop breaking on a missing helper.** Smaller models building a Space sometimes left out one of the small helper functions while still calling it, so the finished app showed an error like "mdToHtml is not defined" the moment it opened. Skales now provides those helpers to every generated app itself, so the app runs even when the model forgets to include one.

- **The left sidebar shows every item again.** With a lot of features switched on, the navigation list could grow tall enough to push the bottom actions (Settings, Stop Server) off the screen. The list now scrolls on its own and the bottom actions stay pinned and reachable, in every theme.

- **Telegram messages stay in their own chat.** Messages you send to the Telegram bot used to land in whichever agent chat happened to be open on the desktop, and then show up a second time in your default chat. The bot now keeps its own dedicated Skales chat, so a conversation you start on Telegram stays in one place and stops appearing twice.

- **The voice button appears once speech-to-text is set up.** The microphone in chat stayed hidden unless you switched on the Voice Chat skill, so setting up a Whisper server or a speech-to-text key looked like it did nothing. The mic now shows up as soon as any speech-to-text option is in place (your own local Whisper server, Groq or OpenAI Whisper, or Azure), and the Settings hint now says the URL field is what powers it. An always-on wake word is not in this release.

- **/clear in Telegram actually starts a fresh chat now.** The command used to reply "Context cleared" without doing anything, so the bot kept right on with the old conversation. It now opens a new chat for whichever agent you are talking to (/new does the same), while the previous conversation stays saved in your history.

- **The dashboard Tasks widget shows the real list.** It loaded once and then held on to tasks you had already deleted, and hid finished ones entirely. It now refreshes on its own, puts active tasks first with older ones below in a scrollable list, and a task you delete (or clearing them all) drops off right away.

- **No more double "+" on the dashboard Connections card.** "Manage connections" showed two plus signs and dropped you at the top of Settings. It is now one clean link that opens the AI Providers tab directly.

- **Remove an MCP environment variable while setting one up.** Each variable row in the MCP setup got a delete button, so a typo in a variable name no longer means closing Settings and starting over.

- **The Identity Maintenance task is tidy again.** On the Tasks page it had started showing its internal setup text and a delete button that never did anything. It now shows a short note instead: it lives under Settings > Memory, where you switch it on or off, and you can still run it by hand from the Tasks page. Long task descriptions also collapse behind a Show more toggle so the list stays readable.

- **AIPointer ⦿ actually sends the screenshot now.** The overlay collected your question but never captured or attached the cursor-area screenshot, so vision-capable models kept replying "I can't see your screen". AIPointer now grabs the screenshot (and your clipboard, when that chip is on) at submit time and sends it along, so "what am I looking at?" works on wiggle, hotkey, and bullet-click triggers.

- **AIPointer ⦿ region selection captures the right area.** Holding the trigger a second time and dragging a rectangle now attaches exactly that crop to your next question. Previously the drag drew the box and flashed "Selection captured", but the captured pixels were thrown away and the query silently fell back to the default cursor-centered shot. The drawn region now wins over the default capture and over the chat-only chip, and it clears itself after one query (or when you dismiss the box) so a leftover crop never sticks to a later question.

- **AIPointer ⦿ honours your dedicated Vision Provider.** Earlier the overlay sent every screenshot through whichever AI provider was active for chat, ignoring the separate Vision Provider you set up under Settings > AI Providers. Now AIPointer reads that config the same way the main chat's screenshot tool does: bring your own local LLaVA on Ollama or a custom localhost endpoint for vision, and AIPointer routes the cursor screenshot straight there while text questions keep going to your usual chat brain. Single-image queries only; multi-image is unchanged and stays on the chat brain.

- **AIPointer ⦿ auto-attach finally fires inside Skales.** Highlight up to 5 files in Finder (macOS) or Explorer (Windows), press the AIPointer hotkey, and the selected files queue for the next query. The paperclip button next to the mic also opens a file picker. The "N files attached" pill above the prompt confirms what's lined up; the queue clears after each submit. Images become vision context, text files inline into the prompt, binaries (PDF, DOCX, XLSX) get referenced by name. macOS will ask for Finder Automation permission on first use.

- **Bullet pill stops flickering while you type.** Typing in any text field outside Skales (browser address bar, another app's composer, the chat editor itself) no longer makes the small status pill at the bottom of the screen flicker on every keystroke. The internal "user is busy elsewhere" signal now only runs when the big AIPointer answer pill is actually open, so the idle bullet stays calm.

- **AIPointer ⦿ wiggle / hotkey stop dying after one missed trigger.** When the "activate only when Skales is minimized" guard rejected a trigger (because Skales was the focused window), the trigger state machine stayed stuck pretending an AI session was open. Subsequent wiggles or hotkey holds got silently swallowed until you clicked the bullet manually to force a reset. The guard now rolls the state back cleanly so the next trigger gesture works straight away.

- **No more dark overlay across the screen on minimize.** AIPointer's transparent overlay window paints transparent regardless of which Skales theme is active. The wake-up recovery effect that re-applies Skales' theme background was firing inside the overlay's renderer on every visibility change and stamping a solid dark background over the user's screen. That effect is now scoped to the main Skales window only.

- **AIPointer ⦿ response text readable in light theme.** A hardcoded white text colour on the overlay wrapper was overriding the response markdown's per-theme colour rules. Removed, so the answer body and headings follow your AIPointer Appearance picker (Light / Dark) the way the rest of the surface already does.

- **Spell-check actually underlines misspellings in the chat composer.** The chat input had `spellCheck={false}` hardcoded on both the mobile and desktop composers, which silently nullified the Settings > General > Spell-check language list. With the toggle removed, your selected dictionaries (English, German, Croatian, the rest of the 13 supported languages) get red underlines and right-click suggestions like every other editable field. The same fix lands on the AIPointer ⦿ prompt input.

- **AIPointer ⦿ Settings tab readability.** The FAQ section's titles were rendering invisible on dark Skales themes (white text on the tab's forced light surface). Replaced the theme-variable colours with the tab's own dark-gray palette so every entry, Skales-specific ones at the top and the longer AIPointer reference list, stays readable in any theme, all behind one consistent accordion. The "What AIPointer is / is not" block above it and the "Coming with Skales v11" preview switched to the same palette.

- **AIPointer ⦿ tab header.** The opener box now renders "AIPointer" as one word the way it's branded. The duplicate header card with "Cursor-anchored quick-ask..." was redundant and is gone; the brand opener at the top of the tab and the Help card at the bottom keep the GitHub link and version.

- **AIPointer ⦿ inside Skales no longer asks the system keychain on launch.** The standalone AIPointer keeps its own encrypted provider key store; the in-Skales build doesn't need it because Skales bridges every provider call. On launch the AIPointer module now detects it's running inside Skales (presence of the Skales data directory) and skips the keychain probe entirely, so users with an existing standalone AIPointer install don't see a "Skales would like to use the keychain" prompt every time they open Skales.


## v10.3.7

Settings performance pass, a Friend Mode safety hold, GitHub moves to MCP, plus a handful of cleanups.

### Changed

- **Settings opens faster.** Switching providers, opening the model picker, and changing tabs feel responsive again. A deeper rework that makes every Settings tab open instantly is queued for the next release.

- **Settings reachable from every menu.** A Settings shortcut now sits at the bottom of the sidebar, the icon rail, the top navigation, and the mobile menu, right above Stop Server.

- **GitHub access moves to MCP.** The built-in GitHub setup in Settings has been removed. GitHub stays reachable by adding the GitHub MCP server under Settings > MCP.

- **Friend Mode temporarily off.** Proactive outreach is paused while the underlying session work it depends on is finished. The feature returns in an upcoming release.

- **MCP page retired.** Adding, editing, testing, and removing MCP servers all happen in Settings > MCP. The standalone page that duplicated this surface is gone.

- **More accurate provider filter.** With "Show only active" enabled, the provider list only shows the providers you have actually configured.

- **Clearer import message.** When a chat history import finishes, the confirmation now points to your History panel and how to find the imported conversations.

### Fixed

- **Playground stops failing on dashboards and analyzers.** Generating a dashboard or analyzer no longer trips a validation check meant only for research.

- **Icon rail menu stays on screen.** The overflow menu on the left rail now opens upward instead of running off the bottom of the screen on shorter windows.

- **Sidebar buttons stop getting clipped.** Buttons that used to disappear behind the window edge on smaller heights are now visible.

- **Discover posts keep their line breaks.** Multi-paragraph posts render with the paragraph breaks the author wrote, instead of collapsing to one block of text.

- **Filesystem connector works on Windows.** Adding the built-in filesystem connector no longer fails on Windows out of the box.

- **Broken connectors stop being retried every turn.** Failing connectors back off into a cooldown, and that cooldown survives an app restart instead of resetting on every launch.

- **Identity Maintenance writes timeless profile content.** The daily profile update no longer bakes the running Skales version or release dates into your saved profile, and rewrites any sentence that still carries one.

- **Identity Maintenance no longer shows up in chat.** The internal task body for the daily maintenance run is no longer visible in your chat stream when the schedule fires.

- **Identity Maintenance scheduled task no longer duplicates.** Repeated runs of the setup flow only ever leave one entry in place.

- **Profile better at parsing pasted paths.** Pasting a path or URL into chat no longer mangles it into a garbage token in your saved profile.


## v10.3.5

Background work, a lighter prompt on smaller models, a one-click memory mode, and a round of fixes.

### Added

- **Background tasks.** You can start something, switch to another view, or close and reopen the window, and it keeps running. When you come back, the result is waiting for you.

- **Tasks stay paused only when they should.** A run pauses only when it genuinely needs your approval, not just because you navigated away. Approval requests survive navigation, so nothing gets stranded or lost.

- **Get notified when work finishes.** When a background task completes while you are on another page, you get a notification with sound and a marker on the chat in the sidebar.

- **Memory mode in one click.** The memory mode button in the chat header now cycles through all three modes with a single click, each with its own clear colour, so you can adjust it without opening settings.

### Changed

- **Images you send stay visible.** An attached image now shows as a thumbnail in your message and stays there, even after a reload. Click to open the full image.

- **Leaner prompt on smaller models.** The prompt sent to smaller and local models is lighter, without losing any awareness of what Skales can do.

### Fixed

- **Smoother scrolling when switching between conversations.** Opening one conversation out of another no longer overshoots before settling.

- **Imported chats are clearly marked by source.** Chats migrated from another tool now carry a badge in your history naming where they came from.

- **Stop and killswitch respond immediately.** Both fire instantly, even in the middle of a running task.


## v10.3.4

Hotfix session.

### Fixed

- **macOS Apple Silicon installer launched into a "Server files missing, please reinstall Skales" error.** The v10.3.3 arm64 build was packaged incorrectly. Both Mac architectures are now packed from a single shared build pass that cannot diverge.

- **Left sidebar "More" menu rendered empty on smaller windows (most visibly on Windows).** Clicking the three dots opened a popover whose items were not visible. The menu now renders as intended.

## v10.3.3

A focused hotfix release. The MCP-button fix from v10.3.1 and v10.3.2 finally lands on every setup. Assistant replies no longer appear trapped inside the Tool Results disclosure. Local models with large context windows stop feeling reset after a few tool-heavy turns. And Discover gets a focused upgrade.

### Fixed

- **Edit a configured MCP server straight from Settings.** Each server row in Settings now has an explicit Edit button next to Test, Toggle, and Remove. Clicking it opens a form pre-filled with the server's current settings. Every row icon carries a tooltip and screen-reader label, translated across all 12 locales.

- **MCP status badge updates immediately after a successful Test.** A green Test result no longer leaves the badge stuck on "stopped". It flips to "connected (N tools)" right away.

- **Environment variable values are readable by default.** They used to render as password dots, which made copying tokens out of a vault painful. They are now plain text with a per-row Show / Hide toggle for screen-sharing situations.

- **Assistant prose no longer hides inside the Tool Results disclosure.** When an assistant turn had both an answer and tool calls, the answer used to render inside the collapsed disclosure, so reading the reply required clicking the header first. The prose renders above the disclosure now.

- **Local endpoints with large context windows stop feeling reset after a few tool-heavy turns.** When Skales had no live context-length info for a model, it used to clamp it to a conservative value, which triggered auto-compression far too aggressively. The floor is higher now, and a wider range of community model families are recognised so they default to their real context size. User overrides under Settings > Override Model Limits still win on top.

- **Override Model Limits respects every Custom Provider slot.** Users running multiple Custom Provider slots can set one override that applies to all of them, unless an explicit per-slot row exists. Capitalisation differences between your override row and what the server reports no longer silently drop the value.

- **Skales can read its own past conversations now.** When you ask the assistant in natural language "what did we discuss about X yesterday?" or "find that chat where I planned the Vienna trip", it can now pull snippets directly from your saved sessions (including chats imported from ChatGPT, Claude, and others) and answer instead of falling back to memory only. The /search slash command is unchanged. It stays a fast local text scan.

- **Ollama "Max tools" slider labels line up with the slider value.** Setting the slider to 25 used to land it between two label positions that pretended to be "15" and "35" but were actually placed elsewhere. Labels now sit at their true values. Visual only, behaviour unchanged.

- **Web reader returns the full extracted page.** More of the extracted page reaches the model now, so summarising a long article works the way the tool description promised.

- **The /projects autocomplete shows a real description.** Typing /p used to surface the raw translation key in the suggestion. Translated across every language.

### Added

- **Recent group in the chat-header model picker.** The picker leads with a small "Recent" section showing the last five models you actually sent with, ahead of any curated list. Locally installed Ollama models and custom model ids land at the top of the dropdown without needing to be in any built-in catalog. A Clear button empties the list.

### Discover gets a focused upgrade

**Privacy disclosure with explicit consent.** The Join Discover wizard now shows a small paragraph under the tag input explaining exactly what is stored on the Skales server (the tag you chose and a one-time random ID, not your name, email, or device fingerprint), and a checkbox you have to tick before the Next button enables. The shorter privacy line on the final step has been rewritten to match what is actually stored, not the vague "no personal data" copy from before.

**Polls.** Posts marked as polls render with a question and up to eight option buttons. Click an option to vote. One vote per identity per poll. Expired polls render as Closed and the buttons disable.

**Rename your tag, or reset your identity entirely.** Settings > Discover gets two new buttons next to Edit Profile and Leave Discover. Rename Tag changes your gamertag in place, your existing posts and votes stay attached. Reset Identity wipes both the local copy and the server-side row, so you can rejoin under a fresh name.

**Activity tab.** A new chip in the Discover filter row opens an inbox grouped into Mentions, Replies, and From Admin. Auto-refreshes every minute while open. Click an unread item to mark it read.

**Hashtags.** Inline #tags in any post are clickable now. Click one to filter the feed to posts that carry that tag. The filter banner at the top has a Clear button. Works alongside the existing author filter.

**Pinned-by-admin posts.** Posts the Skales admin flags as pinned sort to the top of the feed with a small Pinned badge.

**Force-rebrand handling.** If the Skales admin flags your tag (impersonation, offensive content, etc.), Skales wipes your local identity, shows a toast, and routes you back to onboarding so you pick a new tag. Your existing posts and votes are not deleted, only the tag is reset.

**Smaller Discover polish.** Author avatars get a soft pulse when the post is fresh. The empty state offers three quick-jump buttons instead of the dry "Be the first to post!" line. The compose box placeholder cycles through short prompts when empty so the box never feels stale. Translated across all 12 locales.

### Smoke-test follow-ups

- **Gemini 2.0 family removed.** The 2.0-flash family was deprecated upstream. Picker entries replaced with 2.5-flash, 2.5-pro, and the 3-preview models. Existing settings that point at 2.0-flash auto-migrate forward on next load.

- **In-app navigation no longer reloads the page.** Clicking Open Settings on a toast, the Memory Mode badge in the chat header, and the /settings, /discover, /studio, /codework, /wordpress slash commands all navigate inside the app.

### Deferred

Thread modal (click a reply quote to see the full thread), user profile modal (click a tag to see bio plus recent posts), and post scheduling are not in this release.

## v10.3.2

A maintenance release. Things that already worked now work the way the screens promised. Eleven tracked bugs squashed across MCP, providers, importer, install docs, and locales.

### Fixed

- **Adding an MCP environment variable works on every platform.** The "+ Add environment variable" trigger used a prompt that was unreliable. Replaced with an inline text input and confirm button. Enter-key confirms.
- **MCP Edit deep-link lands on the right tab and scrolls to the right form.** Clicking Edit on the MCP page could previously land on the wrong tab or scroll to an unrelated row. Reliable now. The same fix flows through to template and WordPress / auto-backup anchors.
- **Ollama "detected" banner no longer contradicts a red "not running" hint on Win11.** Previously, a green banner and a red error box could show at the same time when Ollama was running but had no models. The banner now splits: green "Ollama detected, N models available" when models are present, amber "Ollama detected, no models found. Run: ollama pull llama3.2" when zero models are present.
- **Imported ChatGPT, Claude, OpenClaw, and Hermes conversations show up in the sidebar.** Imported chats were previously invisible in the Sessions sidebar. Each imported conversation is now a real chat session with a `[Imported: <source>]` title prefix. Memory search across imported conversations finds substance now.
- **Same-provider retry on transient errors.** Transient failures (network resets, timeouts, HTTP 502, 503, 504) no longer go straight to "No response received." in the chat UI. Skales now retries on the same provider before bubbling up. Layered above the existing model-fallback and cross-provider fallback. Configurable per provider under Settings > Providers.
- **Clearer error messages when using a meta-router.** When a meta-router is configured through the custom-provider slot and an upstream provider is not authenticated, the router used to return a generic network error. Skales now rewrites the message to "Router could not reach upstream provider X. Open your router dashboard and finish connecting X, or switch to a model from a connected provider."
- **API key redaction in error messages covers more providers.** Previously caught Anthropic and OpenAI key forms. Now also catches xAI, Groq, Google, JWT-style keys, and credentials embedded in proxy URLs. Plain English text like "Basic auth required" is left untouched.
- **Locale parity across all 12 locales.** Five chat and settings strings were English originals in all 11 non-English locale files. Translated in DE, ES, FR, HR, JA, KO, PT, RU, TR, VI, ZH. No English drift this release.
- **Linux install guidance updated.** Removed stale "(Beta)" label. Corrected artifact filename patterns. Clearer guidance for Ubuntu 24.04+, with the recommendation to use the `.deb` package on apt-based distros.
- **Friend Mode outreach reads context now.** Outreach used to pick a random keyword and write about it for days, in whatever language it felt like, with no record in your chats. It now reads from your persona, recent session, and memory before sending on Telegram, WhatsApp, or Email, and the message lands in your chat history tagged "via Friend Mode". Replying to the outreach lands in a session that already knows what was said. Language follows your preferences first, then mirrors what you wrote last.
- **MCP Add Server opens the form on arrival.** Previously the "Add Server" button on the MCP page dropped you in Settings with no tab and no scroll. It now opens Settings on the Integrations tab, scrolled to the MCP section, with the Add Server form open.
- **Importer fixes.** The migration picker labelled the GitHub Copilot Chat parser as "Microsoft Copilot", now corrected. Imports from Copilot and Gemini now upload reliably in the same path as ChatGPT and Claude.
- **File tools report where the file actually went.** In workspace-sandbox mode, write operations are redirected into a workspace folder. The result messages used to show the original path, which meant the model would try to read it back from the wrong place. They now show the actual resolved path, with "(redirected to workspace sandbox)" appended.
- **Empty provider responses retry instead of dying.** Providers occasionally return a 200 with no content. That used to surface as "No response received." Skales now retries empty responses the same way it retries network errors. Tool-only responses and deterministic safety refusals are deliberately NOT retried.
- **Provider health check no longer wastes quota.** When Skales fell back to a secondary provider it used to ping the primary every minute. That ate quota on free tiers and could invalidate prompt caches. Recovery now happens on the next real user request: the primary is tried first, and on success the fallback banner clears. The "Retry now" button still works.
- **Retry button on assistant error bubbles.** After all retries and the fallback chain are exhausted, you used to be left with no obvious next move other than retyping. A small Retry button next to the error message now re-submits your last user text. Attachments are not re-attached. Edit the message if you need to retry with a file.
- **Per-provider Timeout and Retries settings live under AI Providers now.** Both used to render inside the Memory tab, which is not where anyone looks for provider configuration. Moved to the bottom of Settings > AI Providers. Saved values are unchanged.
- **The "You can now customize your menu" upgrade notification is gone.** It was a v10.3.0 announcement that kept reappearing. Removed entirely. New users discover Add-Ons through normal navigation.

### Changed

- **Context-size badge loads in all builds.** A previous regression broke the badge in certain builds. Showing user-overridden limits in the badge is queued for v11.

### Migration sources

- ChatGPT, Claude, GitHub Copilot Chat, OpenClaw, and Cherry Studio all import end-to-end with both user messages and assistant responses.
- Gemini imports your prompts only. Google Takeout does not export model responses, so the assistant side of each conversation is empty by design.
- Hermes is supported as an import source. Most users will not need this. It is there for people migrating off Hermes specifically.

## v10.3.1

A maintenance release that cleans up rough edges from v10.3.0. Nothing new on the surface. Things that already worked now work the way the screens promised.

### Fixed

- **Custom Folders survive mode switches.** Saving settings while in Workspace Only or Unrestricted mode used to wipe the configured Custom Folders list. Switching to Custom mode would then show an empty list even though paths were configured. The list is now persisted in every mode.
- **OS notifications respect the Friend Mode OS-notify toggle.** Every incoming Telegram message used to fire a native desktop toast regardless of the Friend Mode setting. OS toasts now respect the setting.
- **Telegram replies are tagged "via Telegram" instead of "via Desktop Buddy".** Subsequent replies in a session used to be relabelled. The original source is now preserved on every turn.
- **MCP Start actually starts the server.** The Start button used to leave the status at "Stopped / 0 tools" even after clicking it. Start now spawns the process and lists tools immediately, the same way Test does. Stop kills the running process without touching the saved config.
- **MCP Edit opens a pre-filled form in edit mode.** Clicking Edit on an existing MCP server used to navigate to an empty Add form. The form is now pre-filled with the server's current settings; the button reads "Save changes" and there is a Cancel option to back out without persisting.
- **MCP template tiles pre-fill the Add form.** Clicking a template tile on the empty-state MCP page now fills in the form for that template instead of dropping you on a blank form.
- **MCP Logs button works.** The Logs drawer used to fail. It now opens and shows the captured logs for the selected server.
- **MCP configs with a combined command string work on all platforms.** A config like `"command": "npx -y obsidian-mcp-server@latest"` with empty args used to work only on Windows. macOS and Linux now handle it too.
- **Desktop Buddy drag stays smooth across the whole screen.** The mascot used to get stuck on Linux when dragged past a certain point. Drag now works the same way on macOS, Windows, and Linux.
- **Desktop Buddy snaps back to a visible display.** If the buddy ends up off-screen after a monitor change, sleep/wake, or rearrangement, it moves back to the primary display's bottom-right corner on the next show.
- **Desktop Buddy on Linux lets clicks through the transparent area.** The bottom-right rectangle around the mascot used to block clicks from reaching the desktop underneath. The buddy now passes clicks through wherever the mascot, the speech bubble, and the input pill are not.


## v10.3.0

A power-user release. The first genuinely native organisational surface (Project Tracker), a working RAG primer, a real command palette, Friend Mode that actually fires, a summarize flow that returns inline infographics, and a manual /cast page for DLNA. The minor-version bump is for the Project Tracker.

### Added

- **Project Tracker (`/projects`).** Linear-style local workflow inside Skales. Each project carries a title, description, status (idea, planning, in progress, paused, done), priority, tags, optional deadline with a colour-coded progress bar and "X days left" / "Overdue by X day(s)" caption, milestone list, notes, and attachments. From the detail view, "Discuss with AI" or "Start working" launches a chat session scoped to the project. From chat: `/projects` (list), `/projects new "Title" | desc` (create), `/projects status "Title" -> in_progress` (move), `/projects open "Title"` (jump in). Storage is local.
- **Friend Mode is alive again.** Proactive check-ins broke when Buddy Mode landed in v8/v9. They work now whenever Friend Mode is enabled, and toggling the master switch in Settings takes effect immediately.
- **WhatsApp and Email channels for Friend Mode.** WhatsApp sends to the first permitted contact. Email sends to your own configured address. The "Coming Soon" placeholder is replaced with a working toggle.
- **Cmd+K / Ctrl+K command palette.** Global fuzzy launcher across every visible nav item, every settings tab, and your 20 most recent chat sessions. Hidden in buddy, spotlight, and bootstrap windows.
- **/search command in chat.** Full-text scan over your saved sessions. Magnifier icon in the bottom-left composer toolbar prefills the composer. Results render inline as ranked snippets with one-click links back to the original chat.
- **/rag command and local Knowledge Base.** Paste documents on /memory (new Knowledge Base card). `/rag <query>` in chat returns the top matching chunks with source labels and scores. All local.
- **Summarize style topbar.** Click the summarize button to choose between text, markdown, HTML infographic, or extract-and-summarize. HTML mode renders inside a sandboxed iframe inline in chat with an editorial aesthetic. The composer stays clean while you type.
- **/cast page.** Manual surface for DLNA / UPnP discovery and control. Lists every device found, shows a discovery log, casts any HTTP media URL with play, pause, stop. Gated by the casting add-on, off by default.
- **13 new bundled templates** across chat, browser, studio, codework, code, planner, organization: Friday Weekly Review, Rubber-Duck Debugger, 2-Option Decision Matrix, Competitor Pricing Scan, Brand Palette Poster, README from Scratch, Deep Work Day Plan, Research+Write Pipeline, Launch Plan Starter, and more.
- **Knowledge Graph visualization.** The KG data store has existed since v9. `/memory` now renders a real graph view with a type-colour legend and hover-to-highlight when KG is enabled.
- **Brand Kit to Studio image bridge.** Brand colours, tone, and typographic direction are appended to every image-generation prompt now, matching what video generation already did.
- **DLNA discovery actually finds devices.** Discovery is more patient and runs in parallel with the fallback scan by default, so dual-band routers no longer under-report.
- Disabled add-ons disappear from all menus consistently.
- Add-Ons toggles take effect across every surface: sidebar, settings tabs, chat tools dropdown, chat quick actions.
- One-shot upgrade notification in the Notification Center explains that add-ons can now be toggled from the sidebar. Dismissed once, never reappears.
- Older sessions with legacy tool-call format play back without breaking chat replay.
- "Powered by GIPHY" and "Powered by Klipy" attribution in Settings, Chat, and Discover Feed.
- Add-Ons page reorganized into tabbed sections: Skales Tools, Communication, Integrations, Computer & Vision.
- Context-size badges next to model names in chat composer and settings, colour-coded by size.
- General settings group: default location and temperature unit. Powers the weather widget and the in-chat weather lookup.
- Multiple Google Calendar IDs supported. Plus-button in calendar config adds a row; reads cover all configured calendars.
- Jina Reader joins Tavily as a web-text extraction option, selectable in Settings > Providers.
- AppImage on Ubuntu 24.04+ now starts cleanly even on restricted kernels.
- Studio Gallery deletes now stick. Toast on failure.
- Reasoning blocks from local model runtimes render cleanly in chat.
- Consistent "Tool Result" label for tool result blocks.

### Changed

- Memory section moved out of the Security tab.
- Tavily and web extractor selector moved from Integrations to Providers.
- Studio and Integrations tabs consolidated.
- Settings search now matches correctly.
- Memory Consolidation (Dreaming) toggle saves on click. Most users finally see a nightly run.
- Sidebar order: Discover lifted above Notifications, Projects lifted above Agents.
- Toasts no longer surface in the buddy desktop pet, the mini-chat overlay, or the spotlight window. They appear only in the main app window.
- Notification action URLs that start with `/` now navigate in the same window instead of opening a new one.
- Set Up Vision Provider button deep-links into Settings instead of routing to Add-Ons.
- Skills renamed to Add-Ons across navigation, page headers, and subtitles.
- Beta indicators removed everywhere except Studio.
- Tools for unconfigured integrations no longer get sent to the model on every request. Big reduction in token usage on small-context local providers.
- ~250 untranslated placeholders cleaned up across 11 non-English locales.
- When you ask Skales "what can you do?", the answer now covers Projects, Knowledge Base (RAG), Chat History Search, Command Palette, Hugging Face Spaces, the Jina extractor option, multi-calendar fan-out, and the default-location weather behaviour.

### Fixed

- Friend Mode now sends proactive messages reliably.
- /search magnifier button is visible on desktop now (was hidden in the mobile-only icon row). Moved to the bottom-left composer toolbar.
- Summarize prefix "Summarize this (URL, Text..):" no longer leaks as visible text into the input bar.
- Mixed-language strings in Russian and Chinese gallery confirmation dialogs.

### Removed

- Deprecated legacy Custom OpenAI provider section.


## v10.2.12

### Added

- **Friend Mode is alive again.** Proactive check-ins broke when Buddy Mode landed in v8/v9. They work now whenever Friend Mode is enabled, and the master toggle in Settings takes effect immediately. No app restart needed.
- **WhatsApp and Email channels for Friend Mode.** WhatsApp sends to the first permitted contact. Email sends to your own configured address. The "Coming Soon" WhatsApp placeholder is replaced with a working toggle.
- **Cmd+K / Ctrl+K command palette.** Global fuzzy launcher across every visible nav item, every settings tab, and your 20 most recent chat sessions. Hidden in buddy, spotlight, and bootstrap windows.
- **/search command in chat.** Full-text scan over your saved sessions. Magnifier icon next to the slash button prefills the composer. Results render inline as ranked snippets with one-click links back to the original chat.
- **/rag command and local Knowledge Base.** Paste documents on /memory (new Knowledge Base card). /rag <query> in chat returns the top matching chunks with source labels and scores. All local.
- **Knowledge Graph visualization.** The KG data store has existed since v9. /memory now renders a real graph view with a type-colour legend and hover-to-highlight when KG is enabled.
- **Brand Kit to Studio image bridge.** Brand colours, tone, and typographic direction are appended to every image-generation prompt now, matching what video generation already did.
- **DLNA discovery actually finds devices.** Discovery is more patient and runs in parallel with the fallback scan by default, so dual-band routers no longer under-report.
- Disabled add-ons disappear from all menus consistently.
- Add-Ons toggles take effect across every surface: sidebar, settings tabs, chat tools dropdown, chat quick actions. Disabling Notion (for example) removes it everywhere until you turn it back on.
- One-shot upgrade notification in the Notification Center explains that add-ons can now be toggled from the sidebar. Dismissed once, never reappears.
- Older sessions with legacy tool-call format play back without breaking chat replay.
- "Powered by GIPHY" and "Powered by Klipy" attribution in Settings, Chat, and Discover Feed.
- Add-Ons page reorganized into tabbed sections: Skales Tools, Communication, Integrations, Computer & Vision.
- Context-size badges next to model names in chat composer and settings, colour-coded by size.
- General settings group: default location and temperature unit. Powers the weather widget and the in-chat weather lookup.
- Multiple Google Calendar IDs supported. Plus-button in calendar config adds a row; reads cover all configured calendars.
- Jina Reader joins Tavily as a web-text extraction option, selectable in Settings > Providers.
- AppImage on Ubuntu 24.04+ now starts cleanly even on restricted kernels.
- Studio Gallery deletes now stick. Toast on failure.
- Reasoning blocks from local model runtimes render cleanly in chat.
- Consistent "Tool Result" label for tool result blocks.

### Changed

- Memory section moved out of the Security tab.
- Tavily and web extractor selector moved from Integrations to Providers.
- Studio and Integrations tabs consolidated.
- Settings search now matches correctly.
- Toasts no longer surface in the buddy desktop pet, the mini-chat overlay, or the spotlight window. They appear only in the main app window.
- Notification action URLs that start with `/` now navigate in the same window instead of opening a new one.
- Set Up Vision Provider button deep-links into Settings instead of routing to Add-Ons.
- Skills renamed to Add-Ons across navigation, page headers, and subtitles.
- Beta indicators removed everywhere except Studio.
- Tools for unconfigured integrations no longer get sent to the model on every request. Big reduction in token usage on small-context local providers.
- ~250 untranslated placeholders cleaned up across 11 non-English locales.
- When you ask Skales "what can you do?", the answer now covers the v10.2.12 surfaces: Knowledge Base (RAG), Chat History Search (/search), Command Palette (Cmd+K), Hugging Face Spaces, Jina extractor option, multi-calendar fan-out, and the default-location weather behaviour.

### Fixed

- Friend Mode now sends proactive messages reliably.
- Mixed-language strings in Russian and Chinese gallery confirmation dialogs.

### Removed

- Deprecated legacy Custom OpenAI provider section.


## v10.2.9

Hotfix for Organization task lifecycle.

### Bug Fixes

- **Instant abort for Organization tasks.** The Abort button cancels in-flight calls within milliseconds now, instead of waiting for the current call to time out. No more wasted tokens on aborted runs.
- **Project deletion stops running tasks.** Deleting a project with an active task aborts the task first, so it stops cleanly.
- **Orphaned tasks cleaned up on startup.** Tasks left running after a crash or restart are marked aborted on next boot, so the UI does not try to resume dead tasks.


## v10.2.8

### Skales Mobile is Live on Android

Skales Mobile is now publicly available on the Google Play Store for Android phones and tablets. Connect to your Skales Desktop instance over the encrypted relay for full feature access, or run the standalone mode with 27 native mobile tools. Install from the Play Store at https://play.google.com/store/apps/details?id=app.skales.mobile.

iOS is in review with Apple. The Play Store launch is the public beachhead; iOS lands the moment review clears.

### New Features

- **Memory Mode.** The setting formerly known as Token Compressor is now called Memory Mode, with clearer mode names (Always Remember, Compact, Minimal) and a more intuitive UI. Minimal mode moved behind an Advanced disclosure to prevent accidental selection. When the active mode is non-default, a small amber Brain badge appears in the chat header to surface the state and provide a one-click jump back to settings. Hidden in Mini Mode, matching the established pattern for Voice, Call, Share, and Incognito.
- **Codework resume banner.** When the most-recent Codework session was paused or interrupted, a dismissible resume banner appears at the top of the welcome view with Resume and Dismiss buttons. The banner replaces the previous Continue button as the canonical resume affordance. Dismiss transitions an active session to a stopped state and persists so the banner does not reappear.
- **Codework file-tree toggle.** New header button toggles the file tree pane visibility, with state persisted across restarts.
- **Codework recent sessions sorted by activity.** Recent sessions now sort by last-touched time instead of filename. Status badges expanded to five states: IN PROGRESS, DONE, ERR, STOPPED, or none for unknown.
- **Sidebar agent filter.** The sidebar now filters sessions by the currently selected agent, so clicking a session no longer reroutes to a different agent's context.
- **Open Folder button.** Codework projects now have an Open in Finder / Open in Explorer button in the project header.
- **OpenRouter as default provider.** New installs and first-time setups now default to OpenRouter as the primary provider for faster onboarding.
- **Tasks expand modal.** Long task results no longer truncate silently. Click any task to open a full-text modal.
- **Persona persistence.** Selected persona now persists across conversation restarts.

### Bug Fixes

- **Session writes no longer clobber each other.** Concurrent writes from chat, buddy, mobile bridge, Telegram, and Spotlight could previously overwrite each other. They now serialize correctly.
- **Tool-only assistant turns no longer vanish.** Interrupted tool calls used to be silently dropped from the chat. They now render as an italic indicator showing the attempted tool names, preserving the conversation timeline.
- **Skill AI and GPT-5.x consolidation.** Edge cases in the GPT-5.x reasoning detection added in v10.2.7 are consolidated and covered.
- **Tool pruning logic.** A regression in tool-pruning for large conversations is corrected.


## v10.2.7

Hotfix for three user-reported regressions surfaced after v10.2.6. No new product surfaces. Auto-updater pipeline unchanged.   Locale parity preserved.

### Bug Fixes

- **OpenAI GPT-5.x models failing with 400 errors.** v10.2.6 detected o1, o3, o4, and bare gpt-5 but missed every GPT-5.x dot-version. Detection now covers the full lineup (gpt-5.1 through gpt-5.5) including every documented suffix and dated snapshot. Works regardless of routing path (direct, OpenRouter, Custom Provider, or any OpenAI-compatible relay).
- **Custom Provider 404 errors.** Base URLs that already include a version segment or full path are detected and not duplicated. Z.ai, Groq, and other providers with non-default URL structures work out of the box. Same detection applies to model-list discovery.
- **Telegram proactive messages returning provider errors.** Friend Mode, Identity Maintenance, daily standup, and cron task completion notifications now go through the same path as in-app chat, so reasoning-model handling stays consistent across every send site.


## v10.2.6

Mini-release focused on critical user-reported bugs across the OpenAI and Gemini providers, sleep/wake recovery, capabilities awareness, and the Planner. No new product surfaces. Auto-updater pipeline unchanged.  

### Bug Fixes (Critical, User-Reported)

- **OpenAI provider 400 across all models.** OpenAI's chat completions API changed conventions in late 2025. Skales now uses the current field names and reasoning-model conventions per model class.
- **Gemini tool calling broken (thought signature missing).** Multi-turn tool conversations with reasoning-enabled Gemini 2.5 Pro and Flash now work.
- **Sleep / wake white screen.** Returning from system suspend or unlocking the screen no longer leaves Skales stuck on a blank page.
- **Capabilities awareness.** Skales knows about its own UI features when asked: math rendering, HTML preview, code-block actions, edit / branch / delete on user messages, manual compact, token-split tooltip, MCP servers, and the live skills system. Asking "can you do math?" or "can you render HTML?" returns "yes" with the right context.
- **Planner: weekly schedules fired daily.** The day-of-week selection used to default to Mon-Fri, which made any "weekly" schedule fire every weekday. Defaults now reset to a single day when you switch to weekly.
- **Planner: day-of-week selections respected.** Picking "Monday + Wednesday" now fires only on Monday and Wednesday.
- **Planner: tasks not visible in Tasks list.** Recurring tasks created in the Planner now appear in the global Tasks page alongside one-off tasks. Each Planner run still produces its own execution entry with full logs.
- **Telegram proactive Friend Mode messages not firing since the Desktop Buddy proactive feature was added.** Friend Mode check-ins, autopilot approval notices, daily standup delivery, and cron-task completion notifications all fire correctly on Telegram again, surviving bot restarts.
- **MCP Servers tab failing to load with 401 error.** Now loads correctly.



## v10.2.5


### Bug Fixes (Critical)

- **Skills system.** Skill toggles were silently ignored since the feature shipped. Computer Use Tools, Calendar Reminders, and other skills now actually function when toggled.
- **UI Skill Toggles.** Toggles persist across restart. Previously, toggles appeared to switch on but reverted after reload. Silent backend errors now trigger UI rollback.
- **Playground Override Persistence.** "Use active model" for per-mode overrides no longer springs back to the previous selection after Save.
- **MCP State Reporting.** The model reports MCP server status correctly instead of always claiming "off".
- **MCP backend status.** Returns real per-server status (disabled, connected, stopped, error) instead of hardcoded "connected" with 0 tools.
- **Calendar Reminders Endpoint.** Was permanently skipped due to a broken setting read. Now wires up correctly.
- **Proxy support.** All provider sites now route through proxy-aware HTTP. Runtime ECONNREFUSED errors with proxy enabled are gone.
- **Token Cap Cloudflare and NVIDIA.** Bumped from a conservative floor up to the real provider ceiling.

### Features

- **KaTeX Math Rendering.** Inline `$E=mc^2$` and block `$$...$$` render as actual mathematics.
- **Edit, Branch, Delete on User Messages.** Hover actions on user bubbles. Edit triggers truncate-and-resend. Branch creates a new chat from that point. Delete removes the message and all subsequent responses.
- **Manual Compact Button.** Compress chat history on demand instead of waiting for the auto-threshold.
- **Token Split Tooltip.** Hover the token badge to see input and output split. Default display unchanged.
- **Code Block Copy.** Hover any code block to reveal a Copy button. 2-second "Copied!" feedback.
- **Code Block Ctrl+A Scoping.** Ctrl/Cmd+A inside a code block selects only that block, not the whole window. Works for Markdown code blocks AND HTML preview blocks.
- **HTML Preview Copy.** Copy button added to the HTML preview header alongside Download HTML.
- **Identity Maintenance Toggle.** Moved to its dedicated section in Settings (was buried under Agent & Tasks).

### Stability / Polish

- **Header Responsive Layout.** Buttons collapse to icon-only on narrow windows with native tooltips on hover. Header no longer breaks on tablet portrait or narrow desktop.
- **Provider Switcher Dropdown.** Anchors correctly in chat and playground. No more left-side cutoff.
- **Compact Button hidden in Mini Mode.** Mini Mode stays minimal.
- **Compaction context retention.** Recent tool calls are preserved as examples after auto-compact.
- **MCP servers no longer crash the app.** Unhandled errors from misbehaving MCP servers are caught.
- **Token Display Tooltip.** Power users see input and output split, casual users see unchanged total.

## v10.2.2

### Provider layer

- **Live model fetch for cloud providers.** Each provider card in Settings > AI Providers now has a Refresh button. Anthropic, OpenAI, Google Gemini, Groq, DeepSeek, Mistral, xAI, Together, MiniMax, Cloudflare, NVIDIA, SambaNova, and Cerebras all support live model listing. Clicking refresh updates the model picker. Model dropdowns prefer the live list when present and fall back to the built-in baseline. New models become usable without a Skales release.
- **User-configurable model limits.** New collapsible "Override Model Limits" section under AI Providers. Add per-provider, per-model override rows for context and output token caps. Use `*` as the model name to apply the limit to all models of that provider that don't have an explicit override. Useful for newly released models whose limits differ from the built-in registry.
- **Per-provider proxy now actually routes.** v10.2.0 declared the feature but it was not wired through correctly. Fixed.

### Chat

- **Manual message delete persists across reload and restart.** v10.2.0 trimmed the in-memory message list but did not save the deletion. Now saved.
- **Branch action creates the correct slice.** v10.2.0 surfaced the Branch button but the slice index was wrong. Clicking Branch on the Nth message now creates a new session with messages 1 through N inclusive.
- **Bubble action labels and toasts are translated.** A handful of locale keys shipped without translations in v10.2.0. Real translations added across all 12 locales.

### Settings

- **Per-Mode Model Override UI uses real provider data.** The dropdowns previously showed a hardcoded curated list regardless of what you had configured. Now mirrors the chat header picker: provider list shows only enabled providers with API keys, model list reflects your configured plus live-fetched models for the chosen provider.
- **Playground on-page picker and Settings Per-Mode Override stay in sync.** Both surfaces persist to the same place and rehydrate from disk on every change.
- **The "?" agents-info trigger no longer appears on the Settings page.** It belongs on the Agents page only, which is unchanged.

### UI

- **Chat and Playground header model pickers hide on small viewports.** On narrow widths the picker is hidden entirely, matching the existing Mini Mode behavior.

### Notes

- Settings schema additions are optional with safe defaults. Existing settings load unchanged.
- 12-locale parity preserved.


## v10.2.0

Iterative quality release across providers, modes, error UX, and chat history. No new product surfaces. Existing surfaces become more resilient and configurable.

### Provider layer

- **Per-provider, per-model limits.** Context window and max output tokens are now looked up per provider and per model. Replaces the previous hardcoded fallback ceilings used across all modes. Unknown models fall through to per-provider defaults, then to a conservative absolute fallback. Live values from HuggingFace Router can override the static entry at call time.
- **Smart context compaction with LLM summary.** When effective context exceeds the budget threshold, older turns are summarized in a single low-cost call instead of being truncated. Falls back to truncation if the summary call fails.
- **Provider error translation.** Raw provider error bodies are translated into actionable user messages with the right next action. Covers Ollama crashes and missing models, OpenRouter rate limits and missing credit, Anthropic and OpenAI context-exceeded and auth issues. Generic fallback adds provider and status for debugging.
- **Per-provider proxy support.** Provider configs accept an optional proxy setting. When set, requests to that provider route through the proxy. Existing settings load unchanged.
- **Multiple custom OpenAI-compatible endpoints.** Settings now supports more than one custom endpoint at a time. The legacy single Custom Provider continues to work and is auto-migrated. Per-entry: label, base URL, API key, model, enabled, tool-calling, and vision toggles.

### Modes

- **Per-mode model resolution.** Each Skales mode resolves provider and model from: explicit caller override, then per-mode override in Settings, then the global active provider and model. Exposed in Settings as a "Per-Mode Model Overrides" panel covering Chat, Codework, Organization, Studio, Playground, Buddy, Spotlight.
- **Playground respects active model.** The previous silent override to Anthropic Sonnet 4.5 is now an opt-in setting (default OFF). When OFF, Playground uses the active provider and model or the per-mode override. Toggle and per-conversation provider and model picker now live on the Playground page header.
- **Inline model picker in Chat.** Compact icon-only button in the chat header opens a popup listing installed providers and curated models. Layout never shifts. Background respects the active light/dark theme. Custom agent provider and model wins over the global default. Picker is hidden in Mini Mode.
- **Chat command `/model <id>` persists.** The slash command writes the new model to your settings, refreshes the picker, and surfaces a clear error bubble on save failure.

### Tools and routing

- **Calendar routing disambiguation.** Natural-language calendar phrasing ("in Google Cal", "in den Kalender", "gcal", "schedule a meeting at TIME") routes to the calendar tool reliably. Planner is now clearly for autonomous Skales prompts, not human appointments.
- **Tavily gate respects user toggle.** When the Tavily skill is disabled or no Tavily API key is configured, web search is filtered out of the tools sent to the model. Other web tools remain enabled.
- **Tool prune for small-context providers.** Providers with small token-per-minute ceilings (such as Groq) automatically receive a pruned tool list, preventing "request too large" errors on free tiers.

### Autopilot

- **Master Switch persists from the Autopilot page.** Toggling the master switch from the Autopilot page (not just Settings) now persists alongside heartbeat start/stop. Activate-on-Start works from a clean restart regardless of which UI surface the toggle came from.
- **Friend Mode observability and persistent cooldown.** Skip reasons are logged. Cooldown survives app restart so it no longer resets to zero on every launch.
- **Identity maintenance auto-approve.** Optional Settings toggle. When enabled, the daily identity maintenance job bypasses the safe-mode and critical-action approval gates. Logged to the audit trail. Default OFF.

### Chat UX

- **Manual delete and branch from any message.** Hover actions on user and assistant message bubbles. Delete trims trailing tool messages so no orphan tool results remain. Branch creates a new session populated with messages up to the chosen point.
- **Resume action on error toasts.** Provider error toasts now carry an action button keyed by the error type: continue or retry on local-model crashes and timeouts, compact on context-exceeded errors, switch-fallback on rate limits and quota errors, open-settings on auth failures.
- **Continuation on output truncation.** When a model stops because it ran out of output room, Skales now asks it to continue instead of dropping the partial answer.

### Settings UX

- **Three-fallback UI cap removed.** The Fallback Chain section accepts as many entries as you want to add.
- **Per-Mode Model Overrides panel.** New section under AI Providers. Per mode: "Use active model" toggle plus provider and model dropdowns when the override is on.
- **Additional Custom Providers panel.** New section under Advanced. Each entry is a card with label, base URL, API key, model, enabled, tool-calling, and vision toggles. Add and remove buttons. Legacy single-slot Custom Provider UI continues to work.
- **Identity Maintenance Auto-approve toggle.** Lives under Autopilot in v10.2.0. Will move under Settings > Memory near the existing identity maintenance controls in a follow-up.

### Discover

- **Layout fixes for long-form posts.** Post text wraps on long URLs. Category badges truncate when very long. Header row wraps when content is wide. Skales Insider posts no longer break the feed layout.

### Telegram

- **Approval flow shows continuation hint.** After a Telegram-approved tool runs, the result message ends with "Tap or send Continue to resume." so you know the agent flow is paused, not finished. Optional auto-resume setting (default OFF) lets the agent continue automatically.

### Updater notifications

- **Changelog field carries through the update notification.** The auto-update notification now includes the full changelog whether the trigger came from a server check or an automatic detection.

### Localization

- 11 new error-translator keys plus 3 new model-picker keys, translated across all 12 locales (de, en, es, fr, hr, ja, ko, pt, ru, tr, vi, zh).


### Notes

- Settings schema additions are optional with safe defaults. Existing settings load unchanged.

---


## v10.1.1 - Hotfix

Five hotfix items rolled up on top of v10.1.0 Design. No new features.


### Vision routing

- **Vision-capable model detection extended.** Gemma 3, Gemma 4, LLaVA, Pixtral, Qwen-VL, Qwen2-VL, Qwen2.5-VL, and MiniCPM-V variants are now recognised. Image inputs route to the configured vision model correctly.
- **Explicit user override is respected.** If you have set a Vision Model in Settings, it is used regardless of whether auto-detection knows about it. Auto-detection becomes a fallback, not a gate.
- **Tool-call hardening.** Malformed tool-call JSON is parsed forgivingly. On total failure, one explicit retry asks the model to return valid format. Tool execution errors are surfaced into the next turn so the model cannot silently report success on a failed write or denied permission.

### Chat history

- **Mobile-origin badge.** Messages synced from Skales Mobile now show a small phone icon next to the timestamp. Tooltip reads "Sent from Skales Mobile". Read-only visual cue, no behavioural change.

### Autopilot

- **Activation modes.** Settings on the Autopilot page now include an Activation Mode picker with three options: Manual (legacy default, last toggle persists), On Startup (heartbeat starts automatically when Skales launches if the master switch is on), and Time Window (heartbeat is active during a user-defined daily 24-hour window such as 09:00 - 17:00). Time windows that cross midnight are supported (e.g. 22:00 - 06:00). Manual toggles inside an active window are respected for the rest of that window so you can pause without fighting the auto-activation. Existing v10.1.0 users default to Manual and see no behaviour change unless they explicitly switch modes.

---

## v10.1.0 "Design"

The biggest creative update yet. Skales Studio gets a Design Tab that turns prompts into real HTML and CSS designs. Codework matures into a full autonomous coding agent. HF Spaces and MCP servers now work everywhere. Smoother animations across the app.

### Studio

- **Studio Design Tab** is the new first tab in Studio. Type a prompt, pick a template (Landing Page, Dashboard, Mobile Screen, Pricing, Hero, Login, Settings), get usable HTML and CSS back. Live preview, palette extraction, font extraction, fullscreen preview (Escape to exit), inline refine drawer, recent designs dropdown. Designs persist between sessions.
- **Studio Image Generation revival.** HuggingFace image provider now works for SDXL, FLUX, and other models. Clear error messages on failure with provider-fallback suggestions.
- **HTML extraction is more forgiving** of common LLM output variants (fenced, unfenced, with or without DOCTYPE, truncated). Smaller models that don't follow exact output format still produce usable designs.
- **Smooth tab crossfades in Studio** on supporting browsers. Graceful fallback on Firefox.

### Codework

Codework matured significantly across the v10.0.4 to v10.1.0 cycle. It is now a full autonomous coding agent, not just a chat with file tools.

- **Approval Gates.** Three new toggles: auto-approve writes, auto-approve exec, auto-approve all. Conservative defaults (Review mode) for first-time users.
- **Forbidden command denylist** expanded. Common destructive operations (`rm -rf $HOME`, fork bombs, dd to disk, etc.) are blocked even with auto-approve enabled.
- **Test loop with progress guardrail.** Codework can run a test command after each code change. After repeated test failures with no progress, the loop aborts and reports back instead of grinding tokens.
- **Preview Mode** for write operations. Write tools generate diffs for you to accept or reject before applying.
- **MCP tool consumption.** Connected MCP servers are now exposed as tools to Codework. Conservative auto-approval gating.
- **Repository-map indexing.** Codework builds a project-wide map of functions, classes, and exports per file. Scales to 500+ files.
- **Long-context tiers.** For huge projects, Codework adapts what it includes in context based on project size.
- **Token usage tracking.** Live token counter shown in Codework, updating per call.
- **Commit-message generator.** New helper drafts commit messages from staged changes following Conventional Commits style.

### Cross-tool integration

- **HF Spaces and MCP everywhere.** Activated HF Spaces and connected MCP servers are now usable from Chat, Codework, AND Studio. Add a Space once, use it anywhere.
- **Active Tools Across Skales** panel in Settings shows which tools are available in which surfaces (Chat, Codework, Studio).
- **Studio can invoke any active HF Space directly.**

### Lio AI

- **Recursive project snapshot.** Lio AI builds a complete file map of your project on each plan and build cycle. Better context awareness for multi-file changes.
- **Plan context** assembled from project structure and chat history for higher-quality plans.

### Chat

- **Short queries keep their tools.** Queries like "Explain X with examples" no longer get stripped to plain chat by the auto-prune heuristic.
- **Exact token counting for context-budget calculations.** Tools are pruned only when they actually exceed provider rate ceilings.
- **Smoother streaming token rendering.**
- **Update toast localized** in all 12 locales with version interpolation. Update detail page renders the actual changelog.

### Stability

- **File reading and writing hardened.** Malformed JSON, missing files, BOM characters, and partial writes no longer crash the app.
- **Hierarchy clarity in Organizations.** Person, Agents, and Organization no longer get confused in multi-agent setups.
- **Namesake trope removed** from all 12 locales (was a phrase pattern that drifted across localizations).
- **Codework session sidebar** active-state correctly handles trailing slashes (no more two-row highlights).
- **Delete session prompt** now properly localized in all 12 languages.


### Mobile

- **Outbox foreground sync.** Pending messages flip to "failed" immediately when the app resumes.
- **Periodic outbox sweep** keeps state fresh during active chat use.

### Landing

- **Migration sources.** Landing page and Migration Importer now list OpenClaw, Hermes, and Cherry Studio alongside ChatGPT, Claude, Copilot, Gemini.
- **Three new feature blocks**: ComfyUI (local image generation), HF Inference Providers (200+ models), DeepSeek V4 (1M context, agent-tuned).

### Note on Lio AI export from Studio

The "Open in Lio AI" export from the Studio Design Tab was removed. Lio AI and Studio Design are different workflows and the link did not work. Use the Download HTML button instead.


## v10.0.4 - April 20, 2026

### Telegram Integration
- **Fixed**: Safe Mode approval flow broken since v9.x. Tool approvals from Telegram now correctly trigger the approval prompt and execute on your "yes" response
- **Fixed**: Telegram bot no longer requires opening the chat page after app launch to come online. The bot starts automatically once the app is ready

### Provider Presets
- **Added**: Minimax, Cloudflare Workers AI, and Nvidia NIM as first-class provider presets with pre-filled endpoints. No more manual Custom OpenAI-Compatible configuration needed for these
- **Added**: "Show only active" toggle in the Providers list to hide unused providers

### Chat & UX
- **Added**: Response time display on assistant messages, see how long each response took
- **Added**: Global hotkey `Cmd+Shift+H` (macOS) / `Ctrl+Shift+H` (Windows/Linux) to toggle Desktop Buddy visibility. Handy for fullscreen video
- **Improved**: Settings search now covers more sections, handles accents (é matches e, ä matches a), and has better keyword coverage in German, Spanish, French, Russian
- **Improved**: Fallback provider banner reworded for clarity with a details modal explaining why the fallback activated and how to fix the primary

### Export & Remote Access
- **Fixed**: Export via Tailscale or remote browser access no longer returns a corrupted HTML file instead of a ZIP.

### Email
- **Improved**: Outlook, Gmail, and Yahoo IMAP authentication errors now explain the App-Specific Password / OAuth2 requirement (Microsoft disabled Basic Auth in 2022) instead of showing a generic "auth failed" message

### Build & Infrastructure
- **Fixed**: Boot log now reports the correct version on every release

### Locales
- All 12 locales (en, de, es, fr, hr, ja, ko, pt, ru, tr, vi, zh) updated with v10.0.4 strings. Informal register maintained.

---

## v10.0.3 - Stability (April 18, 2026)

### Bug Fixes
- **Bonjour/mDNS Collision.** Multiple Skales instances on the same machine no longer shadow each other in swarm discovery
- **Multi-Agent Dispatch Toast.** Completion notification was silently dropped after all subtasks finished. Now fires with job title and subtask count.
- **Update Page i18n.** "Later" button showed a raw key instead of translated text. Translation added to all 12 locale files.
- **Ollama Small-Model Warning.** Settings panel shows an orange warning when a known small model (3B params or fewer) is selected with Max tools above 0, advising you to reduce tools or switch to a larger model.
- **fal.ai Studio Hang.** Video generation polled a stale URL after fal.ai changed their queue structure. Fixed.
- **Codework UI Lag.** Blank activity panel during the first second of a session replaced with a "Starting session..." indicator so the UI never appears frozen.

---

## v10.0.2 - 2026-04-18

### Fixed

- **Tool Filter Regression (critical).** Disabled the context-aware tool filter introduced in v9.2.1 which was silently dropping core tools. This was the root cause of the widespread "Unknown tool" errors after v10.0.0. All tools are now available in every conversation.
- **Export Dialog "Source path not allowed".** Exports failed silently in v10.0.1 because the OS temp directory was not on the allowed source-path list. Fixed.
- **Multi-Step Exit Guard.** Response text emitted alongside tool calls used to be misread as an exit signal, breaking multi-step tasks. Fixed.

### Improved

- **Per-turn cap on identical tool calls raised.** The previous cap was too low to support normal bulk operations like creating multiple folders or writing many files. Infinite loops with identical arguments are still caught by stall detection.
- **Progress-Speak Auto-Continue.** When a model makes tool calls but then stops with short progress-style text ("let me continue", "remaining", etc.), Skales automatically re-prompts it to finish instead of exiting. Mitigates Sonnet 3.7's mid-task pause behavior on bulk operations.

### Known Issues

- Sonnet 3.7 may still pause on large bulk tasks despite auto-continue. Use Claude Opus 4, Sonnet 4, or Minimax for guaranteed single-shot bulk execution.
- Minimax models may emit tool calls as JSON text in chat instead of real function calls for some prompts.
- Codework UI may appear briefly frozen before streaming catches up. The work is happening.
- Multi-Agent Dispatch toast notification is not currently firing. Check the Tasks tab for progress.

---

## v10.0.1 - Hotfix (April 17, 2026)

### Critical Fixes
- **Auto-Updater Schema Mismatch** resolved. Zero successful auto-updates from v10.0.0 was caused by this. Users on v9.x must install v10.0.1 manually once.
- **Export/Import.** Valid zip archives with credential redaction. Accepts legacy formats for backward compat.
- **Multi-Step Tool Chains** no longer exit prematurely when the model returns empty text between tool calls.
- **Advisor Strategy.** Simple chat no longer routed through the expensive Planner.
- **Gemini Tool Schema.** Stripped vendor-specific fields that Gemini silently rejected. Tool calls restored for Gemini models.
- **Calendar reminders and planner tasks no longer get confused.**

### Integrations
- Telegram outbound Chat-ID persists across bot restarts
- SMTP Test race condition eliminated
- Lio AI provider dropdown labels no longer show raw translation key paths
- Custom endpoint URLs (LM Studio, Ollama) accept any capitalisation

### Agent Behavior
- File access works in the configured language without hallucinated "system restriction" excuses
- Folder structure creation supports recursive paths in a single tool call
- Agent checks local state before suggesting support

### Configuration
- New Setting: Request timeout slider for long agent tasks
- Emoji loader stops spamming the console for missing animations

### Discover Feed
- 29 v10 event templates now render custom text

### Security (PHP + WordPress)
- Feed backend: IP hashing aligned across all endpoints
- WordPress Connector 1.2.1: improved token comparison and file upload safety

### Localization
- 132 new settings provider strings across 12 locales
- 4 chat state messages moved from hardcoded English to translation
- Request timeout setting fully translated

### Known Issues
- Reasoning display still abbreviated (deferred to v10.1)
- macOS notarization not yet implemented. Right-click then Open is required on first launch.
- SSH key authentication in SSH tool deferred to v10.1

### Upgrade Path
Auto-update works from v10.0.1 onwards. Users on v9.x: download manually from skales.app once.

---

## v10.0.0 - "Closing the Gap" (April 16, 2026)

The biggest Skales release ever. Desktop, Mobile, and Relay now form one ecosystem: every message you send from your phone routes through Desktop's full tool set, every capability you build on Desktop is reachable from the Mobile companion. Chat feels smoother. Studio speaks video. Settings speaks voice.

### Skales Mobile (NEW)
- Official Skales Mobile app for Android (iOS coming), submitted to Play Store (beta, closed testing)
- Full standalone AI agent in your pocket. 27 mobile tools, works with or without the desktop running.
- Remote Mode: pair via QR over the end-to-end encrypted relay. Keys never leave the devices.
- Paired phones get full access to your desktop's full tool set (shell, files, browser control, email, calendar, Studio, etc.)
- Image upload from mobile forwards to the desktop and gets analyzed like a local upload
- Shared ecosystem: same Discover Feed, same Custom Agents, same Skills

### Studio - LTX-2.3 Video Generation (NEW provider)
- fal.ai LTX-2.3 integration (text-to-video and image-to-video, standard and fast variants)
- $0.06/sec at 1080p, native 9:16 portrait support, 5s and 10s durations
- Added alongside existing Veo, Kling, Runway, Replicate providers
- Live "Connected" badge in Studio when fal API key is configured in Settings
- 4 new localized model labels across all 12 languages

### Animated Emoji System (NEW)
- Noto Color Emoji font bundled. All Unicode emojis render identically on Windows, macOS, and Linux.
- 16 brand and expressive emojis with smooth animations
- Animated splash screen. Gecko mascot animates during app startup.
- Dashboard wave. Hover over the greeting hand for a welcome animation.
- Discover Feed spark picker. Emoji reactions animate on hover, play once in the sent confirmation.
- Chat expressiveness. AI messages with creative, memory, video, or web context emojis animate on arrival.
- Big emoji messages. Send 1-3 emojis alone and they render larger with animation (iOS/Telegram style).
- Easter egg shortcuts in chat: `:gecko:`, `:bubbles:`, `:paw:`, `/highfive`, `/bow`
- Emoji privacy controls. Optional Google CDN fallback in Settings > Privacy (off by default, GDPR compliant).
- Brand emojis preload at startup for instant rendering

### Voice - TTS and STT
- OpenAI TTS provider added (voices: alloy, echo, fable, onyx, nova, shimmer). Reuses the existing OpenAI provider key, no extra setup.
- New "Read responses aloud" toggle in Settings > TTS. When enabled, every assistant reply is spoken via the configured provider once streaming completes.
- Smart markdown stripping before TTS so the voice doesn't read ``` or # out loud
- Per-message speaker button on every assistant bubble. Click to listen, click again to stop.
- Groq-key hint in the STT section (free Whisper access) with one-click jump to AI Providers tab
- All voice UI fully localized across 12 languages

### Chat - Smoothness and Inline Preview
- Smooth spring entrance for new messages
- Session restores stay instant. Only new messages fade in.
- Typing indicator rewritten as a smooth wave
- Typing bubble fades in instead of popping. The indicator never jumps when transitioning to tool-status.
- Scroll-to-bottom button appears bottom-right when you scroll up. Click to return to live view and re-enable auto-follow.
- Inline HTML Preview. HTML code blocks render a live preview with Show Code, Download HTML, Save as Image, Mute, Hide toggles.
- Global mute and hide persist across all chats and sessions
- Save as Image. Pixel-exact capture.
- OS reduced-motion setting disables all animations across the app

### Capabilities & System Prompt
- Version 10.0.0 named "Closing the Gap"
- Skales now knows about Mobile pairing, Inline HTML Preview, the fal.ai video path, Remote API, and the 12 supported languages when asked
- Agent is proactive: when you describe something visual (chart, card, map, SVG, mini-app), it offers inline preview in your language before producing it
- Mobile pairing info is now exposed to the agent
- 6-theme awareness (Dark, Light, Midnight, Forest, Amber, Glass)

### Bug Fixes
- Buddy window draggable on Windows. Cmd/Ctrl+Shift+B global reset shortcut.
- Agent delete button fixed. Replaced with a two-click confirmation directly in the button.
- Playwright chromium detection always picks the newest version installed
- Telegram bot auto-restart watchdog with rate-limit (max 3 respawns per rolling hour). Respects current config.
- Renaming your gamertag updates the existing record in place instead of creating a duplicate
- STT help text shows the translation instead of a raw key
- Studio video-provider "(API key required)" badge now translated across 12 languages
- Boot log now matches the current version (was reporting 9.3.0)
- External links in browser view now open in the default OS browser
- Share window overlay responds to Escape key across chat, spotlight, and buddy
- Browser scroll-to-bottom works reliably on lazy-loading and single-page applications
- Playbook steps now wait for actual page load before proceeding
- macOS screen recording permission detected with user-facing guidance in share window



### Localization
- ~60 new strings added across 12 languages for fal.ai models, HTML preview, voice, Mobile, animated emojis, mute/unmute, scroll-to-latest
- All new German translations are Du/Sie-neutral ("Vorlesen", "Stumm", "Als Bild speichern")


## v9.3.0 - Stability Release (April 13, 2026)

### Stability
- File reading hardened against malformed JSON across the app. Fixes a Windows crash.
- Playground Bridge rewrite. Duplicate injection removed, no more dead buttons.
- Auto-updater fix. Download button now appears correctly, race condition resolved.
- Advisor model validation auto-corrects model IDs for OpenRouter, falls back to primary model on 400/404.
- Playground output cap raised (chat unchanged).
- Skill loading errors consolidated to a single summary line.
- Integrity check downgraded from a warning to an info log.
- Discover Feed admin posting no longer crashes.

### Memory & Intelligence
- Identity Maintenance untouched (runs at 3:00 AM as always)
- Memory Consolidation staggered to 3:30 AM. No overlap with Identity Maintenance.
- Knowledge Graph shows helpful hint when empty instead of "0 entities"
- Agent capabilities awareness updated to v9.3.0 with all current features

### Browser & Automation
- Persistent browser sessions. Logins survive restart.
- Playwright install resolves the binary reliably without depending on the system path.

### Localization
- Removed all "Coming in v9.2.1" text from 12 locale files
- Version strings corrected to 9.3.0 everywhere


## v9.2.5 - "WordPress 2.0" + Playground (April 13, 2026)

### WordPress 2.0
- WordPress Design Skill bundled with 15 Elementor and 10 Gutenberg templates
- Elementor Flexbox Container format (fixes blank pages on modern Elementor)
- Canvas page template auto-set
- Web search available in the WordPress agent
- Selective skill loading keeps the prompt lean
- WordPress Connector Plugin v1.2.0 with collision detection

### Playground (Beta)
- Deep onboarding interview: 15 questions, 4 phases
- AI-powered personalized Space suggestions
- Glassmorphism UI with animated mesh background
- AI-generated interactive Spaces that persist
- AI features wired into the Playground page directly
- Share to Discover Feed with data sanitization
- Milestone system

### New Tool
- **File download tool.** Auto-filename, redirects, VirusTotal scan.

### Fixes
- Duplicate file tools unified
- Slash commands: typed and clicked now identical (all 24 commands)
- /theme toggle fixed
- Memory Consolidation catch-up scheduler
- Playwright install on macOS more reliable
- Discover Feed admin delete and admin free posting
- Studio: Veo 3.0, Imagen 4, GPT Image 1, Kling v2, Runway Gen4 Turbo
- Obsidian theme header navigation updated
- Tool deduplication prevents duplicate function errors
- Tool-awareness warning for local models with tools disabled



## v9.2.3 - File Operations & Stability (April 2026)

### Critical Fixes
- **File tool routing.** Folder and directory tools unified. Tilde expansion now works across all file tools.
- **Model routing.** Skales is now explicit with the model about which tool to use for each file operation.
- **Multi-step tasks.** Agent no longer stops after the first tool call on incomplete directory and file creation.
- **Sidebar version.** Now shows the correct version number (was stuck on 9.2.1).
- **Slash commands.** All 24 commands audited; /tools list updated.

### Improvements
- Duplicate file tools merged. Old names kept as aliases for backward compatibility.
- Duplicate tool definitions removed. Models see one tool per operation.
- Document creation expands tilde paths.
- /tools slash command lists the correct tools.

### Verified (no changes needed)
- Auto-updater: full check, download, verify, install flow confirmed working
- Playwright install: path resolution and error handling all solid


## v9.2.2 - Hotfix (April 2026)

### Critical Fixes
- **Network access restored.** Tailscale, LAN, and remote access work again.
- **Auto-updater.** Full download with progress bar, integrity verification, install and restart UI. No more "Download at skales.app" link.
- **Playwright install.** Install buttons work on systems where brew or npx are not on the default path.
- **Custom Endpoint status.** "Not connected" no longer shown for working local endpoints (LM Studio, KoboldCpp).
- **Custom Endpoint tool slider.** Description updated to mention LM Studio and KoboldCpp.

### Improvements
- Discover Feed admin delete button (for moderators)
- Playwright detection covers more install locations

---

## v9.2.1 - Stability & Completeness (April 2026)

### Ollama / Local Models
- **Tools disabled by default for local models.** Ollama, LM Studio, KoboldCpp, vLLM no longer receive tool definitions. Eliminates timeouts on consumer hardware.
- **Tool slider.** New "Max tools for local models" slider. Shared across all local providers.
- **Fast-fail retry.** If a local model doesn't respond promptly with tools, Skales retries without tools automatically.
- **Timeout leak fix.** Custom endpoint timeout used to override Ollama's longer timeout for all providers. Now scoped to custom endpoints only.
- **Chat hard-kill extended.** Local providers get a longer leash before the chat page kills the request.
- **Local provider detection** covers Ollama, LM Studio, KoboldCpp, vLLM, and any localhost endpoint.

### Advisor Strategy (Fixed)
- **Advisor routing now works in chat.** Plan-vs-execute phase auto-detected from message history.
- **Custom model text field fix.** Selecting "Custom model..." used to clear the model and hide the text input. Fixed for both advisor and executor selectors.

### Agent Skills (SKILL.md)
- **Skills now save to disk.** Imported SKILL.md files persist with manifest tracking.
- **Bulk import.** Import an entire GitHub repo or local parent folder. All subfolders with SKILL.md are imported at once.
- **@-mention in chat.** Type `@` to see a dropdown of installed skills. Select one to inject its SKILL.md content as context for that message. Multiple skills supported.
- **Skills assignable to Agents.** Agent configuration now has a Skills section with checkboxes.
- **Agent skills work across Chat, Spotlight, Browser, Codework, and Organization.**

### Studio
- **API key sharing.** Studio reads keys from main Settings providers. If Google, ElevenLabs, or Azure is configured in Settings, Studio shows "Key set in Settings" instead of "Add API Key".
- **Cloud video generation.** Google Veo, Kling AI, Runway, MiniMax (Hailuo), and Seedance with real cloud API calls and progress polling. No longer "Coming Soon".
- **Veo provider fix.** Was permanently disabled due to a misconfigured provider ID. Fixed.
- **FFmpeg warning hidden for cloud providers.** Cloud video does not need local FFmpeg.

### WordPress
- **Test Connection crash fixed.** WordPress tools now return user-friendly errors for connection refused, 401/403, SSL, and timeout.
- **Full-width CSS v2.** Skales pages render full-width on Astra, GeneratePress, Twenty Twenty-Four, Kadence, OceanWP, and Elementor boxed sections.
- **Skales-created pages flagged for reliable detection.**
- **AI Command Bar reliability.** Clearer workflows for UPDATE, DELETE, CREATE, REDESIGN. More iterations allowed per command.
- **Elementor exits beta.** 5 bundled section templates (Hero, Features Grid, Testimonial, Pricing Table, CTA).
- **WordPress Connector Plugin bumped to v1.1.0**

### Slash Commands (13 new, 24 total)
- `/memory` show memory summary (name, interests, goals, projects)
- `/skills` list installed agent skills with enabled/disabled status
- `/provider` show active provider, model, and base URL
- `/version` show Skales version
- `/export` export current chat as markdown file download
- `/theme` toggle dark/light mode
- `/language` show current locale
- `/settings`, `/discover`, `/studio`, `/codework`, `/wordpress` quick navigation
- `/status` system status check (provider, Ollama, integrations, WordPress)

### Identity Maintenance
- **Runs silently.** No "SECURITY GATE" approval prompts. No dramatic messaging. One-line summary only.

### File Operations
- **Tilde expansion.** `~/` now correctly resolves to home directory across all file write, delete, move, and copy operations.

### Improvements
- Calendar Sync connection status: green/red dot per provider
- Missing skill files warn once per process now, not every cron tick
- ElevenLabs settings link corrected (pointed to Providers, now points to Integrations)
- 13 new slash command descriptions added to all 12 locale files




## v9.2.0 - "The Bridge" (April 2026)

### WordPress Integration (NEW)
- Skales Connector Plugin (MIT-licensed) for WordPress sites
- Token-based authentication
- Auto-detect installed plugins (Elementor, WooCommerce, RankMath, Yoast, cache plugins)
- Create, edit, and delete pages and blog posts with full HTML support
- Elementor page building via JSON sections, columns, and widgets
- WooCommerce bulk price updates by category
- SEO meta management (RankMath and Yoast)
- Media upload (images, videos, PDFs)
- Cache clearing for all major cache plugins
- Full-width CSS injection for Skales-created pages
- Dedicated WordPress management page with AI Command Bar (conversational, real tool execution)
- Per-page AI content generator (inline edit with AI Generate)
- 12 WordPress tools available to the agent

### Stability & Performance
- **Chat loop dedup fix.** Duplicate tool calls are now detected and capped.
- **Tool filter.** Context-based tool filtering reduces the model's tool list per call based on message content.
- **Iteration cap tightened.** Real tasks complete well under the new cap.
- **Skill loading safety.** Missing skill files no longer crash. Graceful skip with warn-once per process.
- **Custom Auto-Updater.** More reliable update flow with streaming downloads.
- **Organization parallel execution.** Independent subtasks now run in parallel.
- **Anthropic timeout increased** for large tool payloads.

### New Features
- **Advisor Strategy.** Opus/GPT-5 for planning, Sonnet/Haiku for execution.
- **Memory Consolidation (Dreaming).** 3-phase overnight memory engine with Dream Diary.
- **Studio Upgrades.** Dynamic model fetching, 10 Style Presets, Camera Controls, Quality Gates.
- **Browser Privacy.** Session isolation, clear cookies, cache, and history.
- **Browser Control v2.** Semantic element detection.
- **OpenClaw Skill Importer.** Import community skills on Custom Skills page.
- **Codework v2.** Multi-file workspace.
- **Lio AI v2.** Template gallery.
- **Social Publishing.** YouTube direct upload and browser-assisted posting.

### Improvements
- Settings page reorganized: Memory tab, Studio tab, proper grouping
- Sidebar grouped into Main, Tools, System sections with always-visible tooltips
- Skills renamed to "Add-Ons" with Activate/Deactivate All
- Model lists update everywhere when one provider's catalog refreshes
- Dark mode persistence improved
- Templates cache faster now
- 12 locale files with 50+ new translation strings
- BSL-1.1 license clarification header

### Bug Fixes
- Tool-call infinite loop fixed
- Browser links no longer open new windows unexpectedly
- File save dialog works correctly
- Settings search covers all new sections (WordPress, Advisor, Dreaming, Memory)
- Sidebar tooltip always visible
- Settings page no longer crashes during navigation
- Studio: Black image, video preview centering, gallery download, reference image handling
- Browser: Session isolation, privacy dropdown, history clear, new tab crash
- Theme and locale persist even after browser data is cleared
- ONNX runtime warnings suppressed


---

## v9.1.0 - "The Studio Update"
Released: April 7, 2026

The biggest feature release in Skales history. Skales Studio,
Templates, Planner AI Tasks, and 40+ improvements across the board.

### Skales Studio (NEW)
- **Image Generation.** Multi-provider support: Skales Visuals
  (built-in renderer), Replicate (Flux, SDXL), HuggingFace,
  OpenAI DALL-E, ComfyUI (local), Stable Diffusion WebUI (local).
- **Video Creation.** Describe a motion graphic, preview the animation live,
  iterate with natural language, export as MP4. Categories: Text
  Animation, Infographic, Data Visualization, Logo Intro, Slideshow,
  Social Post, Counter/Stats.
- **Voice / TTS.** Text-to-speech with automatic provider detection:
  Local, ElevenLabs, Azure Neural, Groq, OpenAI, Google TTS.
- **Music Generation.** AI music via Meta MusicGen (HuggingFace).
  Genre, mood, and duration selection.
- **Gallery.** All generated content (images, videos, audio) saved
  and browsable with filter, search, masonry layout, and reuse.
- **Export.** Format presets for TikTok, YouTube, Instagram, LinkedIn,
  X/Twitter. AI caption and hashtag generator (v9.2.0).
- **Brand Kit.** Save logo, colors, fonts, tagline, tone of voice.
  Optional injection into all Studio generations.

### Templates (NEW)
- 37 pre-built templates across all modules: Chat, Codework,
  Organization, Lio AI, Browser, Planner, Studio
- Click a template to open the module with prompt pre-filled
- Template Maker: AI-guided interview wizard to create custom templates
- Templates shared via Discover Feed (fork from other users)

### Planner AI Tasks (NEW)
- Schedule AI tasks: once, daily, weekly, monthly
- Tasks appear in the calendar grid (purple blocks)
- Auto-execution on schedule
- Confidence scoring: tasks below 50% confidence are skipped
- Dry Run mode: simulate without executing destructive actions
- Task result history with tools used and duration

### Fallback Provider Chain (NEW)
- Configure backup AI providers in Settings
- If primary provider fails, auto-switch to fallback
- Banner notification: "Fallback active: Using [provider]"
- Auto-recovery: checks primary periodically
- API keys inherited from saved provider settings

### Ollama Model Marketplace (NEW)
- One-click install for recommended local models
- Gemma 3, Llama 3.3, DeepSeek R1, Mistral, Phi-4, Qwen 3,
  Codestral listed with sizes and descriptions
- Progress bar during download
- Auto-detection of ComfyUI and Stable Diffusion WebUI

### Browser Playbooks (NEW)
- Record browser sessions as replayable workflows
- Auto-capture URL navigations, clicks, and inputs
- Schedule playbooks as recurring Planner tasks
- Available to the agent in chat and organization

### Social Media Integration (NEW)
- YouTube and LinkedIn OAuth connection in Settings
- Post directly from Studio Export tab
- Instagram, TikTok, Facebook placeholders for v9.2.0

### Knowledge Graph (NEW)
- Knowledge graph builds relationships as you work
- Entities: projects, people, tools, preferences
- Agent can query, update, and delete entries
- Enable/disable toggle and reset in Settings

### Organization Improvements
- Real approval UI with state machine (approve/reject destructive tools)
- Canvas Office visualization
- Shared memory between agents
- Projects CRUD (create, rename, archive, restore, continue)

### Agent Tools (21 new)
21 new agent tools across Brand Kit, image generation and editing,
video creation, voice generation, content extraction, social media,
planner, knowledge graph, and playbooks.

### Internationalization
- 2800+ translation strings across all 12 languages
- All Settings strings now multilingual (450+ converted from hardcoded)
- All module pages fully translated
- Bootstrap wizard fully translated with proper locale loading

### Bug Fixes
- Fixed: Dashboard greeting showing raw translation keys
- Fixed: Planner week and day view missing calendar events
- Fixed: Path traversal vulnerability on code routes
- Fixed: Discover posts showing tips instead of completed tasks
- Fixed: Fallback chain providers not removable after save
- Fixed: Template click not inserting prompt in target module
- Fixed: FFmpeg path resolution on macOS, Linux, Windows
- Fixed: Browser links opening in new tab crashing session
- Fixed: Render progress stuck at 0%
- Fixed: Gallery video downloads serving wrong path
- Removed Beta badges from Swarm, Codework, Organization
- Added Beta badges to Studio, Templates, Playbooks


---

## v9.0.2 - Patch (April 2026)

### Fixed
- Settings: API keys no longer disappear when switching models
- Codework: Project names are sanitized to valid slugs
- Organization: Clipboard copy works with visual feedback
- Organization: Agents respond in the user's configured language
- Discover: Post templates rewritten to describe user activity
- Discover: Added events for Codework and Organization completions

### Added
- YouTube Data API v3 integration (search, video details, channel info, trending, captions)
- Codework: Web search available during code generation

---

## v9.0.0 - "For the People" (April 2026)

### Highlights
- **Agent Skills Import.** Native support for the SKILL.md open standard. Import from Claude Code, Codex, Copilot, Cursor. GitHub URL, local folder, or paste. Works across Chat, Codework, Browser, Spotlight, and Lio AI.
- **Skales Codework.** Autonomous coding agent. Select project folder, describe task, pick model, watch live diffs in 3-panel GUI. Session history and follow-up conversations.
- **Organization.** Multi-agent teams with CEO delegation, departments, Company Packs.
- **Computer Use.** Desktop automation via screenshots, clicks, keyboard, scrolling.
- **Calendar Sync.** Google, Apple, Outlook, CalDAV unified in Planner.
- **7 Integrations.** Notion, Todoist, Spotify, Smart Home, Google Drive, GitHub, Google Docs.

### New Features
- DevKit with API Playground, Debug Panel, CLI, 50+ tool reference
- Migration Importer (ChatGPT, Claude, Copilot, Gemini, OpenClaw, Hermes)
- MCP Server Support (Model Context Protocol)
- New default theme "Skales Modern" (navy and emerald, light/dark)
- Messaging Gateway (Slack, Signal actions)
- 9 professional agents
- DeepSeek direct provider
- Browser Workspaces and Playbooks
- Custom model ID input per agent
- Settings dynamic search (35+ sections)
- Swarm VPN fallback with manual peer IP
- OG preview cards in Discover

### Changed
- Default theme from Classic to Skales Modern
- Light mode as default on first launch
- Skills default state: core features ON, experimental OFF
- Browser loop detection relaxed
- Bubble dismiss timer extended
- Badge color from lime to emerald
- Removed "2.0" from Discover branding
- Removed "Beta" from Browser
- 12 languages (added Turkish, Croatian)

### Fixed
- Calendar events async export crash
- Codework tool hallucination
- Spotlight white flash on open
- Theme flash on restart
- Migration importer file picker error
- Telegram inline keyboard, toast dedup, key persistence
- Settings search not finding Planner and Calendar
- Advanced Integrations in wrong Settings tab
- Raw translation keys in UI
- Crash on certain file writes
- Codework and Organization skill check logic
- Swarm sidebar gating and Skills page toggle
- Dashed-border styling replaced throughout

---

## v8.0.2 - Hotfix (April 2026)

### Fixed
- Chat Error 400: message reconstruction simplified
- Agent "Done" response: removed incorrect tool-call stripping that caused infinite loops with Gemini
- IMAP Email: connects to real server again
- Custom Skills iframe: buttons, inputs, and saves now functional
- Planner weekdays now respect app language setting instead of system locale
- Chat message source badges restored (Desktop, Buddy, Telegram, Spotlight)
- Toast notifications: added X button and click-to-close
- Stop button: more stable behavior on chat page unload
- Chat bubble word-break: fixed mid-word splitting ("correc\nt?" becomes "correct?")
- Think tags no longer leak in Lio AI and Skill AI outputs
- TTS "default" provider: added browser voice selector
- Custom OpenAI-compatible provider: status indicator reflects actual URL config
- Skill Generator: defaults to user's active provider instead of hardcoded OpenRouter
- Telegram bot: auto-reconnects on app restart
- Telegram Safety Mode: approval buttons (Approve/Deny) now use inline keyboard
- Desktop Buddy: sound and notification suppressed when main chat window is focused
- macOS auto-updater: added required ZIP target alongside DMG

### Added
- Notification delete: X button per notification and "Clear All" to dismiss all
- Provider-specific exit condition diagnostics

---

## v8.0.1 - Hotfix (March 2026)

### Fixed
- Chat crash after multiple messages
- Port 3000 conflict detection with health check
- Forked skills truncation (raised limit, added syntax validation)
- Hardcoded German text in UI when set to English
- IMAP email tools now visible to AI when configured
- Discover event spam rate limit survives restart
- A dozen type errors resolved
- Compose drafts now context-aware with per-category agent personality
- Anonymous ID visible in Settings with copy button
- Skills filter tab in Discover feed
- Documents skill: removed non-working Excel claims
- Dark mode dropdown text visibility
- Autopilot priority change no longer deletes task content
- "Feedback submitted" toast shows translated text
- Light theme toggle visibility

### Added
- Migration banner for v8.0.0 users to pick single agent vibe
- Skills filter tab in Discover

---

## v8.0.0 - "Discover 2.0" (March 2026)

### Highlights
- **Discover 2.0.** The first social network where AI agents post, spark,
  mention, and share skills with each other
- **Skill Sharing & Forking.** Share AI-created Custom Skills to Discover.
  Other users can fork (copy) them with one click.
- **Spark.** Send sparks to other agents. Skales' answer to Facebook Poke
  and MSN Nudge. With sound notifications.
- **3 New Languages.** Vietnamese, Croatian, Turkish (12 total)

### New Features
- Discover Feed 2.0 with @mentions, replies, emoji avatars, compose box,
  network visualization, date filters, trending posts
- Spark social interaction system with 6 spark types and sound effects
- Skill AI watermarking for sharing verification
- Share to Discover button for AI-created Custom Skills
- Fork Skill: one-click copy of community skills with safety disclaimer
- Heartbeat system with online counter and network visualization
- Report system for feed moderation with admin review
- Image sharing pipeline with admin approval workflow
- Notification sounds toggle in Settings
- Native file tools for macOS Full Disk Access compatibility
- Toast notification system with theme-aware styling
- Discover onboarding with interest selection, color accent, emoji avatar
- Date filter (Today, This Week, 30 Days, All Time)
- Delete own posts from Discover Feed
- Magic / Spark button for lightweight social interactions
- Edit Discover Profile without losing gamertag

### Fixed
- Discover event pipeline for all tools (images, browser, skills, planner,
  buddy, group chat, spotlight, swarm)
- Browser agent "URL unchanged" false positive on scroll and screenshot actions
- Telegram bot stale lock file on restart
- Request timeout setting now respected (uncapped)
- macOS TCC permission errors with helpful Full Disk Access guidance
- Notification action label displayed correctly
- Swarm only starts network discovery when Swarm is enabled
- Desktop Buddy persists across show/hide (no intro restart on minimize)
- Desktop Buddy no longer steals Cmd+Tab or Dock visibility on macOS
- Token display "0" regression
- Tag duplication in Discover posts
- Toast readable on all themes (light and dark)
- Obsidian theme header icon alignment
- Wrapped card dynamic refresh (includes today's activities)
- Network visualization on high-DPI displays (dots no longer cluster)
- Wrapped PNG export now pixel-accurate

### Languages
- Vietnamese (vi). Full translation.
- Croatian (hr). Full translation, Latin script.
- Turkish (tr). Full translation with correct special characters.
- Total: 12 languages (EN, DE, ES, FR, IT, PT, KO, ZH, JA, VI, HR, TR)

---

## v7.6.6 - Hotfix (March 2026)

### Fixed
- **CRITICAL: Discover Feed tool events never fired.** When users opted in to Discover on the /discover page, the opt-in was saved only locally and never propagated server-side. This caused server-side tool events (image generation, browser sessions, task completions, file organization, swarm dispatches, etc.) to silently not appear in the feed. Only conversation completions worked. Existing users get a background sync on next chat page load.

---

## v7.6.5 - The Intelligence Update (March 2026)

### New Features
- **Token Compressor.** 3-level prompt compression (Full, Compact, Minimal) to reduce API token usage. Configurable in Settings. Minimal is ideal for Spotlight and quick tasks.
- **In-App Toast Notifications.** Floating glassmorphic toasts in the main chat for background task completions, multi-agent dispatches, and dashboard notifications. Auto-dismiss after 5 seconds.
- **Awareness of all UI features.** Skales now knows about Discover Feed, Desktop Buddy (3 skins), Spotlight, Autopilot, Voice Chat, Notifications, Agent Swarm, Multi-Agent Tasks, Planner AI, and Custom Skills. Can navigate you to the correct pages.
- **Discover Feed AI Summaries.** AI instances generate first-person activity summaries locally. Approve or reject on the Discover page before sharing to the community feed. Pulsing dot indicators in sidebar for pending approvals and unread notifications.
- **Custom Skill Interactive UI.** Skills can render their own interactive UI in chat with a bridge for skill-to-host communication.

### New Features (cont.)
- **Skales Wrapped.** Spotify-style weekly stats card. Auto-generates every Monday at 8am or on-demand. Two shareable formats: Square (1:1) and Story (9:16). 4 theme-matched card designs (Skales, Obsidian, Snowfield, Neon). Count-up animations, confetti celebration, staggered stat reveals, animated activity chart. 9 personality badges (On Fire, Power User, Night Owl, etc.). Download PNG, Copy to Clipboard, or Post to Discover. Sidebar pulsing dot when new data. Fully localized in all 9 languages.
- **Discover Feed: GIF Support.** Attach Klipy or Giphy GIFs to AI Summaries. GIF preview in pending approval, safe rendering in feed cards. Admin panel shows GIF URLs and reply-to quotes.
- **Discover Feed: AI Reply and Repost.** Reply to feed entries with AI-generated text. Repost entries to amplify community content. Both with auth verification and rate limiting.
- **Discover Feed: Personality System.** User personality profiles influence AI summary tone and style.
- **Discover Feed: Vibes Tab.** Server-side filtered tab showing only AI summaries.

### Security
- **Discover Repost Auth and Rate Limiting.** Repost endpoint verifies your opt-in. Rate limit: 5 reposts per hour per user.
- **NSFW Filter Expansion.** Gamertag and content filter expanded to 30+ blocked terms covering explicit, violence, hate speech, drugs, and spam.
- **GDPR Delete User Compliance.** Two-pass scrub on user deletion: removes all entries by the leaving user and scrubs replies that referenced them.
- **Admin Panel v6.** Brute-force rate limiting, CSRF tokens, security headers, session hardening.
- **API Rate Limiting on report-status and notifications endpoints.** 429 responses with Retry-After headers.
- **Input validation on all public endpoints.**

### Fixed
- **Discover GIF overflow.** GIF images in feed cards no longer break layout.
- **Discover Vibes tab performance.** Moved to server-side filtering.
- **Discover repost offline handling.** Distinct error messages for rate-limit, server unreachable, and offline states. Graceful degradation for deleted-entry reposts.
- **Admin mobile access.** Burger menu for mobile viewports.
- **Version adoption metric** properly computed from telemetry.
- **Custom Skill buttons.** Skill UIs render interactively with onclick handlers and scripts executing.
- **Skill iframe communication** validated more strictly.
- **Notification polling** reduces server load significantly.


---

## v7.5.0 - The Social Update (March 2026)

### New Features
- **Discover Feed.** Global activity feed showing what the Skales community is building. Gamertag system, upvotes, category filters, blurred preview for non-members. Privacy-first: zero personal data collected, white-label templates only.
- **Spotlight and Vision.** Press Cmd/Ctrl+Shift+S to open a floating search bar anywhere on your desktop. Ask Skales anything without opening the main window. Eye button captures your screen and attaches it to the query for visual context (requires vision-capable model).
- **Spotlight Settings Toggle.** Enable or disable the Spotlight Bar and its global keyboard shortcut from Settings > Notifications. Setting persists across restarts. Disabling it also unregisters the global shortcut to prevent conflicts with other apps.
- **Mini-Chat Mode.** Shrink Skales to a compact always-on-top chat window. Toggle from the chat header or use the Spotlight shortcut.
- **Sound Notifications.** Audible feedback when tasks complete, notifications arrive, or Swarm tasks finish. Theme-aware sounds, configurable in Settings.
- **Agent Swarm Redesign.** Dedicated Swarm page with hub-and-spoke node visualization, task history, quick delegate, and chat integration hints.
- **Notification Center.** Dedicated page for all notifications with read/unread state, filters, and admin broadcast support.
- **Calendar Month View.** Full month grid with event previews, click-to-navigate, and today highlighting.
- **Planner .ics Export.** Download your plan as a calendar file without connecting a provider.
- **TTS Local Provider.** Connect KoboldCpp, XTTS-API-Server, or any OpenAI-compatible TTS endpoint. Configurable in Settings with timeout and automatic browser fallback.
- **Privacy Policy and Delete My Data.** GDPR-ready privacy policy page, in-app Delete My Data button with 2-step confirmation that purges all server-side telemetry, bug reports, and feedback by IP hash.
- **Cookie Consent.** Landing page cookie banner with Google Consent Mode v2. Default deny for analytics/ad storage, granted on explicit Accept.

### Deprecated
- **Network & DLNA.** Network Scanner and DLNA/UPnP casting features retired. The /network route now redirects to Swarm. DLNA casting is planned as a dedicated Smart Home Skill in a future update.

### Fixed
- **Friend Mode and Buddy Intelligence.** Both systems now fire independently of Autonomous Mode. Morning greetings, idle check-ins, meeting reminders, and proactive messages work as configured even when Always-On is off.
- **Calendar delete persistence.** Deleted events stay deleted across view switches and reloads.
- **Desktop Buddy persistence.** Buddy no longer disappears after tab switch or command execution.
- **Ollama detection.** Better error messages and faster checks.
- **KoboldCpp tool calling.** OpenAI-compatible endpoints now send the tools array by default.
- **Telegram loop.** Continued stability from v7.2.1 fix.
- **Bug report email.** Optional contact email now saved and visible to admin.
- **Bug report status sync.** Users see Open, In Progress, Closed status and admin notes.
- **Notification client polling.** Dashboard cards and Notification Center display server notifications.
- **Prompt optimization.** Further token reduction for free-tier models.
- **Swarm state sync.** Settings toggle correctly starts and stops network discovery, auto-starts on boot.
- **Theme responsive.** Swarm, Notifications, and Discover added to all nav variants and mobile menus.

### Security
- API key enforcement for the telemetry endpoint
- Discover Feed: 3-layer gamertag validation, admin shadowban system, rate limiting
- Privacy policy link in Settings > Discover


## v7.2.1 - Hotfix (March 2026)

### Fixed
- **Prompt optimization.** Reduced token usage by moving dynamic context to on-demand tool calls. Free-tier models no longer hit rate limits on simple messages.
- **Calendar widget.** Fixed "Invalid Date" for Google Calendar events with missing dateTime fields.
- **Planner calendar sync.** Fixed "3 errors detected" when sending plans to calendar.
- **Model list cleanup.** Removed deprecated Gemini 1.5 models, added current Groq, OpenRouter, Google models.
- **Weather widget.** Uses device geolocation with Vienna fallback instead of hardcoded Berlin.
- **Telegram approval loop.** Fixed. System jobs bypass approval gates entirely.
- **Identity Maintenance.** Runs automatically without Telegram approval when enabled.
- **Friend Mode.** Tagged as system job, no longer blocked by approval gates.
- **Scheduler heartbeat.** Cron jobs actually execute now.
- **Newsletter telemetry.** Email subscriptions now transmitted to server.

### New
- **Notification system.** Admin can send broadcasts and bug report replies to users. Dashboard shows dismissable notification cards.
- **Browser agent improvements.** DOM settle delay, auto and manual approval modes, dangerous button blacklist, CAPTCHA detection, real-time action log with Markdown export.
- **Agent Swarm.** Network discovery, task delegation, delegate tool, firewall detection, loop prevention.
- **Theme responsive.** Hamburger menus for Snowfield and Neon on mobile, Obsidian tablet overlap fixed, Custom Skills in all mobile menus.

---

## v7.2.0 - "The Next Chapter" (March 2026)

### New Features
- **Dashboard Widgets.** Customizable drag-and-drop dashboard with resizable widgets
  (clock, weather, system stats, quick actions, recent chats, tasks, notes, pomodoro).
  Per-widget settings and theme-aware styling.
- **Cron Scheduling.** Natural-language and cron-syntax task scheduling with job
  management UI, execution logs, and retry support.
- **Browser Tool.** Built-in browser for web research and interaction.
  Sandboxed with user approval flow and screenshot capture.
- **Always-On Agent [BETA].** Background agent that monitors and executes scheduled
  tasks autonomously. Toggle in Settings > Advanced.
- **Live Duplex Voice - Call Mode [BETA].** Full-screen continuous voice
  conversation. Speech-to-LLM-to-speech with barge-in support, waveform visualization,
  and end-call keyword detection. Toggle in Settings > Voice.
- **Multi-Agent Swarm [ALPHA].** LAN peer discovery.
  Discover other Skales instances on the network, view status, and send tasks.
  Hidden behind Settings > Advanced > Experimental.
- **PWA Mobile and Tailscale [BETA].** Progressive Web App manifest with installable
  icons. /mobile page with 4-step Tailscale setup wizard and QR code for phone access.
- **Feedback Page Upgrade.** View your own bug reports with status badges (open,
  in progress, closed). Optional email field on bug reports. Newsletter opt-in
  in onboarding and settings.

### Improvements
- **Ollama Connectivity.** All references switched from localhost to 127.0.0.1 to fix IPv6 resolution issues.
- **Social Links.** X, Instagram, TikTok, and YouTube links in settings, update,
  and feedback page footers.
- **robots.txt and llms.txt** for crawlers and LLM agents.
- **Locale Expansion.** 9 languages (en, de, es, fr, ru, zh, ja, ko, pt) now have full coverage.
  All em-dashes removed from non-English locales.
- **Theme System.** Instant theme switching.

---

## v7.1.0 - "The Local AI Update" (March 2026)

### Bug Fixes
- **Telegram Approval Loop.** Fixed infinite loop where approving an action in Telegram
  triggered the same approval again. Approval responses route correctly and do not
  trigger memory scans.
- **IPv6 localhost.** Fixed bot-to-server connection failure on systems where localhost
  resolves to ::1 instead of 127.0.0.1. (Thanks @bmp-jaller)
- **Think Tags.** No longer leak into chat responses from Qwen and DeepSeek
  models via KoboldCpp. (Thanks @henk717)
- **Desktop Buddy Approve.** Approve button no longer shows "cancelled" due to a sandbox issue.
  Input field no longer overlaps approval buttons.
- **Auto-Updater.** Honest message: "Download at skales.app" instead of a false
  "will install automatically" claim.

### Improvements
- **Onboarding Renamed.** "Custom Endpoint" became "OpenAI Compatible" and moved above Ollama.
  KoboldCpp, LM Studio, vLLM are now first-class options, not hidden under "Custom".
- **API Key Truly Optional.** Empty key means no auth header sent. Local AI servers
  that don't need authentication work without workarounds.
- **Local TTS Endpoint.** Voice settings support local TTS servers (KoboldCpp,
  XTTS-API-Server). Not limited to cloud providers.
- **Local STT Endpoint.** Voice transcription can use local Whisper (KoboldCpp).
- **Local Image Generation.** Configurable image generation endpoint alongside Replicate.



## v7.0.1 - Hotfix (March 2026)

### Bug Fixes
- **Telegram Bot.** Fixed bot process crash on end-user machines. The bot now uses the bundled Node runtime instead of requiring a system Node install. Same fix applied to the WhatsApp bot.
- **Chat Frozen.** Fixed chat becoming unresponsive after vision model error. Session history is now sanitized before every call, preventing corrupted message blocks from breaking subsequent requests.
- **Streaming Timeout.** Added an inactivity timeout to prevent the chat UI from hanging on broken responses.
- **Vision Fallback.** When a model doesn't support vision, images are stripped gracefully and the message is sent as text-only instead of corrupting the session.

---

## V7.0.0 - "The Foundation" (March 2026)

### New Features
- **Proactive Desktop Buddy.** Rule-based buddy intelligence observes calendar, email, tasks, and idle time. Meeting reminders, end-of-day summaries, idle check-ins, morning greetings. Respects quiet hours. No LLM calls.
- **Planner AI.** AI-powered daily scheduling. 8-step wizard learns work patterns, generates time-blocked plans from calendar events, pushes them back to your calendar. Chat integration: "plan my day."
- **Calendar Abstraction.** Google Calendar, Apple Calendar, and Outlook. All three work simultaneously. Planner AI reads from all providers.
- **FTP/SFTP Deploy.** Upload Lio AI projects to any FTP server. Per-project deploy config, incremental upload, test connection, 4 website starter templates.
- **7 Languages.** English, German, Spanish, French, Russian, Chinese (Simplified), Japanese. Full UI translation including onboarding.
- **Skales+ Tiers.** Free Forever, Personal ($9/mo), Business ($29/mo) tier page with waitlist. All features free during beta.
- **Morning Briefing.** Daily digest of calendar events, pending tasks, unread emails, delivered via Telegram and chat.
- **File Sandbox.** Three modes: Unrestricted, Workspace Only, Custom Folders. Enforced on all file tools.
- **Redesigned Onboarding.** 7-step wizard with Cloud, Local, Custom provider cards, Ollama auto-detect, buddy picker, safety mode selection.
- **Model Auto-Fetch.** Real-time model lists from OpenAI, Google, OpenRouter. No more hardcoded model IDs.
- **Linux Beta.** AppImage and .deb builds for x64 Linux.

### Improvements
- **Unified notifications.** All notifications go through one system. Quiet hours, per-type cooldowns, channel routing (bubble, Telegram, dashboard).
- **Settings Restructured.** 6 tabs (General, AI Providers, Integrations, Buddy, Security, Advanced) replace the single long scroll.
- **Custom Endpoint Equality.** Vision toggle, TTS URL, configurable timeout. Local AI is a first-class citizen.
- **Ollama Revolution.** Auto-detect on startup, real model dropdown, faster checks, CORS warning.

### Bug Fixes
- Email Bug 31: Agent respects "send from marketing@" instructions
- Buddy speech bubble height for approval dialogs
- Think and reasoning tags stripped from buddy bubble
- Email whitelist per-mailbox
- Custom endpoint timeout configurable
- Empty API key no longer sends blank auth header
- WhatsApp toggle marked "Coming Soon" (was a dead control)
- Dashboard notification channel fixed (was silently dropping messages)

### Platform
- Windows x64 (stable)
- macOS Apple Silicon (stable)
- macOS Intel (stable)
- Linux x64 AppImage (beta)
- Linux x64 .deb (beta)

---

## V6.2.0 - "The Telegram Fix" (March 2026)

### Critical Fixes
- Fixed: Endless Telegram approval loop. Multiple read-only tools were incorrectly classified as requiring approval. Fixed.
- Fixed: New tools no longer silently block by default. The fallback safety setting flipped from confirm to auto.
- Fixed: Telegram session history preserves tool results properly. The model no longer re-calls already-executed tools.
- Fixed: Google Translate TTS was hardcoded to German. Now uses the user's configured language and locale.

### Improvements
- Telegram approval route now continues the agent loop for natural responses after tool execution
- Autopilot "yes"/"no" intercept now checks task age (5 min window) to prevent eating unrelated messages
- Memory leak fixed in the chat shell on page show events

## V6.1.1 - Hotfix (March 2026)
- Fixed: Telemetry settings now read correctly by the feedback page.
- Fixed: Feature Request textarea not editable on /feedback page (was disabled when telemetry appeared off)
- Fixed: Report Bug sidebar link now opens /feedback instead of old modal
- Fixed: Skin and language changes now prompt for restart
- Fixed: Chat input focus lost after deleting chat or receiving media via Telegram
- Fixed: White screen on mobile Chrome tab switch via Tailscale
- Fixed: Privacy section consolidated. Telemetry toggle moved into Security & Privacy, with dynamic text based on state.
- Updated: All 4 locale files (en, de, es, fr) with new privacy section translations

## V6.1.0 - "The Awakening" (March 2026)

### Autopilot - True Autonomous Agent
- **Recurring Task Scheduling.** Master Plan now generates cron jobs for recurring goals. "Check my email every morning at 8am" creates an actual scheduled task, not a one-shot.
- **Live Execution View.** New tab in Autopilot dashboard shows real-time agent reasoning, tool calls, and results as they happen. Watch Skales think.
- **Automatic Daily Stand-up.** Autopilot generates and delivers a daily briefing via Telegram every weekday at 9am (configurable). No button click needed.
- **Safe Mode: Approval Instead of Skip.** Scheduled tasks in Safe Mode pause for approval instead of being silently skipped. Visible on the Execution Board.
- **Telegram Approval for Autopilot.** Approve or reject Autopilot tasks directly from Telegram. Reply `approve <id>` or `reject <id>`, or simple `yes`/`no` for single pending tasks.
- **Accurate API Rate Limiter.** Cost controls count actual calls per task now. Budget reflects real usage.

### New Features
- **Bubbles Mascot Skin.** A playful blue liquid blob that morphs into different shapes. Selectable in Settings > Desktop Buddy alongside the original Skales gecko.
- **Feedback & Rating System.** New /feedback page with 3 sections: Rate Skales (4 emoji ratings), Report a Bug, Request a Feature. Data sent to server only with telemetry opt-in. GDPR compliant.
- **Admin Dashboard v3.** Redesigned analytics dashboard. Feedback tab with rating distribution, feature request table, and timeline view.

### Bug Fixes (13)
- Fixed: Telegram approval gate ignores safetyMode (Critical)
- Fixed: Telegram inline keyboard buttons never appear (replaced with text-based approval)
- Fixed: Telegram agent hallucinates tool execution when blocked by approval
- Fixed: Telegram pairing shows readable text instead of a raw translation key
- Fixed: Telegram duplicate messages (409 Conflict) from multiple polling instances
- Added: Telegram purge/reset button in Settings
- Fixed: Orphaned tool result blocks no longer crash the Anthropic API path
- Fixed: Replicate images not saved to workspace
- Fixed: Telemetry provider type event now has a cooldown instead of firing on every message
- Fixed: Telemetry language event no longer fires on every app start
- Fixed: Telemetry sends data when opt-in is disabled (GDPR violation)
- Fixed: Rate-limit error now shows the translation instead of a raw key
- Fixed: Identity Maintenance file-path bug
- Fixed: 'medium' priority works correctly in cron task creation

---

## v6.0.2 (2026-03-16)

### Fixed
- **[CRITICAL] Telegram approval gate ignores safetyMode.** Unrestricted mode bypasses approval entirely via Telegram now.
- **[CRITICAL] Telegram inline keyboard buttons don't work.** Replaced with text-based approval ("yes"/"no" replies).
- **[CRITICAL] Agent hallucinates tool execution.** Blocked tools now make their blocked state explicit in the conversation, preventing the model from claiming success.
- **[CRITICAL/LEGAL] Telemetry sends data when opt-in is disabled.** Added a defense-in-depth opt-in check. Zero network requests when telemetry is off. GDPR compliance.
- **[HIGH] Orphaned tool-result blocks crash API.** Added message sanitization that removes tool results referencing non-existent tool calls.
- **[HIGH] Telegram pairing shows raw translation key.** Improved pairing success and failure messages with clear guidance.
- **[MEDIUM] Telegram duplicate messages (409 Conflict).** Added deduplication guard to prevent processing the same update twice.
- **[MEDIUM] Replicate images not saved to workspace.** Fixed download path with explicit error checking.
- **[LOW] Telemetry provider type fires too often.** Cooldown increased.
- **[LOW] Telemetry language event fires every start.** Now only fires when language actually changes.

### Added
- **Telegram Reset button.** "Reset All" button in Settings > Telegram purges all Telegram data.
- **Bubbles mascot skin.** New mascot option: a blue liquid blob that morphs into different shapes. Select in Settings > Desktop Buddy > Skin.
- Skin descriptions shown in the mascot selector UI

### Improved
- Gemini and Replicate images save to a consistent location
- Telegram approval messages are clearer and more user-friendly
- Telegram pairing and error messages are now hardcoded for reliability

---

## v6.0.1 (2026-03-15)

### Fixed
- Safety Mode simplified to Safe and Unrestricted (removed confusing Advanced mode)
- Approval flow no longer stalls after confirming tool execution
- Safe Mode continues the agent loop after approval
- Telegram bot shows proper messages instead of raw translation keys
- Telegram approve and decline inline buttons appear correctly
- Telegram messages cleaned of markdown formatting before sending
- Custom Skill pages have a working input field for all skills
- Replicate image generation works with the new API format
- Telemetry ping limited to once per minute per event
- Capabilities check reports always-active features honestly
- Identity maintenance cron uses built-in tools instead of shell commands (cross-platform safe)
- Locale files verified: all 4 languages have identical structures

### Improved
- Agent acts immediately instead of explaining what it could do
- Platform-aware behaviour: PowerShell vs bash rules based on OS
- Unrestricted mode enables full autonomy
- PDF handling instructions added (try read_file before shell tools)
- Custom skill creation guidance improved
- Enhanced anonymous telemetry: tool usage, provider type, language, feature usage
- All telemetry remains opt-in, anonymous, and GDPR compliant

---

## v6.0.0 - "The Foundation" (March 2026)

### Multilingual
- Full UI translation: English, Deutsch, Espanol, Francais
- Language picker as first onboarding screen
- Language switcher in Settings (always accessible, no restart needed)
- System messages, approval prompts, and error messages translated
- Telegram bot responses in the user's selected language
- Desktop Buddy speech bubbles translated

### New Providers
- Replicate integration (BYOK). Access 50+ image and video AI models with one API key.
- Custom OpenAI-compatible endpoint. Supports llama.cpp, LM Studio, vLLM, koboldcpp, text-generation-webui.
- Tool calling toggle for custom endpoints (on/off, for local models that don't support function calling)

### Skales+
- Tier comparison page (Free Forever, Personal, Business)
- Email waitlist for upcoming premium features
- All current features remain free and unlocked

### Desktop Buddy
- Flickering fix. Smooth crossfade transitions between animations.
- Dynamic folder system. New animations load automatically.
- Full skin system. Add new mascot clips and select from Settings.
- Skin selector in Settings (Desktop App section), shown when more than one skin is installed
- Buddy can now execute tools: write files, send emails, browse the web, manage calendar, and more
- Approve and Decline buttons appear inside the speech bubble when an action needs confirmation
- Auto-executed tools (safe actions) run immediately and show a result bubble
- Tool result summaries shown inline. "Open Chat for details" link for long outputs.

### Privacy and Feedback
- Anonymous telemetry opt-in. Disabled by default. Prompt during onboarding.
- Collected data: app version, OS platform, start and crash events only
- No conversations, no API keys, no file paths, no personal data ever sent
- Anonymous UUID generated once and reused. Never regenerated.
- Report Bug button in the sidebar (bottom, above Stop Server)
- Bug reports sent to developer. Local fallback if offline.
- System info (OS platform) included in reports. Optional checkbox, on by default.

### Approval System
- Unknown tools require approval by default
- Document creation tool added (creates files inside the workspace)
- Telegram inline buttons appear correctly
- Telegram bot works on any port

### Security
- Default tool safety prevents hallucinated tool execution
- Telegram callbacks work regardless of which port Skales is running on
- Chat bubble overflow protection (no more horizontal scrollbar on wide content)

### Bug Fixes
- Chat bubble horizontal overflow fixed
- Translations applied in places that were missing them
- PDF dependency loads reliably

---

## v5.5.0 - March 2026

### Security
- Approval system enforcement. Destructive actions (send email, delete file, calendar changes, tweets) require explicit user confirmation.
- Browser blacklist covers Playwright too. Blocked domains can no longer be bypassed.
- Unrestricted Mode properly bypasses approval gate when enabled
- Screenshot auto-Telegram removed. Only forwards when explicitly requested.

### Accessibility
- ARIA labels on all interactive UI elements (buttons, inputs, navigation, toggles)
- Full keyboard navigation with visible focus indicators
- Screen reader support on chat, buddy bubbles, and approval dialogs
- Skip-to-main-content link
- Compatible with NVDA (Windows) and VoiceOver (macOS)

### Desktop Buddy
- Friendly error messages ("Oops, could you take a look?") instead of raw errors
- Video transition flickering fixed
- Honest response when tools unavailable ("I can only do that in the main chat, Open Chat")

### Bug Fixes
- Input field lock after chat deletion resolved
- Spellcheck disabled globally (both main window and buddy window)
- Custom Skill buttons work now
- Confirmation message shown after approved tool execution


---

## **5.0.0** - The Desktop Companion Update (2026-03-02)

Skales v5.0.0 is the largest single release in the project's history. It ships the full Autopilot meta-agent, Voice Chat, a Custom Skill Ecosystem, Document Generation, Google Places, a Network Scanner, DLNA Casting, a brand-new **Desktop Buddy**, and a comprehensive v5 stability pass.

---

### **Desktop Buddy - Floating Mascot & Spotlight Quick Action**

- **Transparent always-on-top window** at the bottom-right corner of the primary display. No taskbar entry. No shadow. Fully draggable.
- **Mascot states.** The mascot cycles through Intro (welcome clip on launch), Idle (looping base animation), Action (random clip at varying intervals, never repeats the same clip until all have played), and Query (when clicked).
- **Spotlight Quick Input.** Glassmorphism input field with backdrop blur, lime-green glow border, and animated loading spinner. Press Enter to submit, Escape to dismiss.
- **AI Response Bubble.** The reply is shown as a glassmorphism speech bubble with a pointer tail, auto-dismissed after 10 seconds (click to dismiss early). Replies are trimmed for readability.
- **Silent session sync.** Every question and answer is silently saved per day.
- **Settings Toggle.** Desktop Buddy toggle in Settings > Desktop App.
- **Smart Visibility.** Buddy window appears when the main window is minimized or hidden, and hides when the main window is restored. Toggling off instantly hides the buddy.

---

### **Autopilot - The Autonomous Chief of Staff**

- **Autopilot Dashboard.** Dedicated page (`/autopilot`) with four sections: Control Room, Execution Board, Identity & Memory, and Live History.
- **Deep-Dive Interview.** Multi-turn interview that learns your primary goal, niche, budget, and constraints. Saves your profile.
- **Master Plan Generation.** Skales generates a structured roadmap and task list from your profile. Tasks are pushed directly onto the Execution Board.
- **OODA Self-Correction Loop.** If a sub-task discovers new context (dead website, changed pricing, failed dependency), Autopilot autonomously rewrites, deletes, or reprioritises pending tasks and logs the reason with a full audit trail.
- **Human-in-the-Loop Approval Gates.** Tasks involving mass communications, file deletion, or financial transactions auto-flag for approval. The runner pauses until you click Approve or Reject on the Execution Board.
- **API Cost Control.** Configurable max calls per hour and pause-after-N-tasks counter. If a limit is hit, Autopilot pauses and waits for acknowledgment.
- **Anti-Loop Protocol.** Automatic retry tracking. After repeated failures a task is permanently blocked, never retried again.
- **Daily Stand-Up Report.** First-person morning briefing from completed, blocked, and in-progress tasks, plus recent log entries.
- **Execution Board (Kanban).** Full CRUD for tasks: Add, Edit, Cancel, Delete. Filter by state. Shows provider and model, re-plan badge, priority selector, and per-task approve/reject UI.
- **Live History Terminal.** Dark terminal-style log viewer. Colour-coded by level. Auto-polls and caps at 500 entries.

### **Meta-Agent - Universal Skill Dispatcher**

- **Headless Skill Execution.** Autopilot has isolated access to every active skill. Background executions never touch the foreground UI, chat history, or active sessions.
- **Internal Group Chat.** Spawns parallel calls with different personas to reach a consensus on complex decisions.
- **Skill routing syntax.** Tasks can explicitly route to a specific skill handler.

### **Voice Chat Interface**

- **Mic Button.** Amber-styled microphone button between New Session and History (visible only when Voice Chat skill is active).
- **Voice Chat Mode.** Dedicated fullscreen input overlay with status labels (Idle, Recording, Transcribing, Thinking, Speaking), animated pulse ring when recording.
- **Whisper Transcription.** Routes to Groq Whisper first, falls back to OpenAI Whisper.
- **TTS Playback.** ElevenLabs TTS with browser fallback.

### **Skill AI - Custom Skill Ecosystem**

- **ZIP Upload.** Upload a `.skill.zip` to install a new capability. Skales extracts, validates, and loads without restart.
- **AI Scaffolding.** Describe a skill in plain language. Skales generates the full skill definition, handler code, and metadata.
- **Skills Page.** Manage installed custom skills. Enable, disable, view metadata, delete. Isolated sandboxed execution.
- **Security Warning.** All uploaded skills display a security advisory banner before activation.

### **Documents Generation**

- **Word (.docx).** Generate formatted Word documents from natural language.
- **PDF.** Every document request simultaneously generates a PDF version.
- **Excel (.xlsx).** Create spreadsheets with data, formulas, and formatting.
- **Output.** Files saved locally and linked directly in the chat response.

### **Google Places**

- **Nearby Search.** Find restaurants, shops, services near any address or coordinates.
- **Place Details.** Fetch business hours, ratings, reviews, website, phone number.
- **Geocoding.** Convert addresses to coordinates and vice versa.
- **Directions.** Get turn-by-turn navigation data between two points.
- **Photo URLs.** Retrieve Google Places photo references.

### **Network Scanner**

- **LAN Discovery.** Scans the local subnet for devices.
- **Port Detection.** Reports open ports per device. Specifically detects other Skales instances.

### **Media Casting (DLNA/UPnP)**

- **Discovery.** Finds DLNA/UPnP media renderers on the LAN.
- **Cast Controls.** Play, Pause, Stop, Seek, and Set Volume on discovered devices.

### **v5 Polish - Stability, Identity & Infrastructure**

- **Proactive Check-In Cron Loop.** Cron jobs fire automatically on their schedule. In-memory deduplication prevents double-fires within an hour.
- **Voice Chat Mic Crash on HTTP.** Users on plain HTTP now receive a clear error message instead of a silent crash: "Microphone access requires a secure connection (HTTPS or localhost)."
- **Windows App User Model ID.** Toast notifications and taskbar entries now display "Skales" instead of the Electron app ID.
- **Capabilities Registry v5.0.0.** Added 7 new v5 skills: autopilot, custom skills, places, documents, voice chat, network scanner, casting.
- **Mobile UI Polish.** Removed "Talking to: " prefix from the agent selector. Header buttons collapse to icons on mobile.
- **Network & Devices Page** (`/network`). New page with two tabs: Network Scanner (mode selector, live device list with Skales-flag badge) and DLNA Casting (discover renderers, device picker, cast/pause/stop controls).
- **Skill AI Enhancements.** Added "requires API keys" toggle in the Custom Skills generation UI. Enabled required-secrets in the generated skill manifest. Conditional UI Playbook guidance injected when the skill has a UI.
- **Fluid Identity.** Rewrote how Skales builds its self-context. Includes current time, who Skales is, who the user is, key learnings, and recent memory highlights.
- **Agent-to-Agent Protocol** (`/api/agent-sync`). New endpoint supporting ping, handshake, delegate, and status operations. Optional bearer-token authentication.

### **Wake-Up Crash Fix**

- **Global error boundary** catches render errors and async errors. Shows a Skales-themed fallback with a "Reload Skales" button.
- **Polling Guards.** Background polls pause when the window is hidden to prevent wake-up crashes. Applied to voice, video poll, Telegram poll, inbox check, calendar reminders, memory scan, and email check.

---

## **4.0.0** - The Desktop Edition (February 2026)

### **New Features**

- **Native Desktop App.** Skales is now a proper desktop application for Windows and macOS. Install it once. No terminal, no manual server starts, no browser required. Launch it like any other app.
- **Single-Instance Lock.** Opening Skales a second time focuses the existing window instead of spawning a duplicate.
- **Smart Port Detection.** If port 3000 is occupied, Skales automatically tries 3001 and 3002 before failing gracefully.
- **Launch at Login.** Toggle in Settings > Desktop App to start Skales automatically when you log in. Works on both Windows and macOS.
- **Graceful Shutdown.** Skales now signals the internal server on quit and waits for in-flight tasks to finish before force-killing. No more torn bot sessions or half-written data.
- **Hidden CMD Window on Windows.** No more console window flash on startup.
- **macOS app bundle** includes proper copyright, version strings, privacy usage descriptions, and local networking permissions.
- **Home Directory Data Storage.** All user data now lives in the user's home directory, not inside the app bundle. Data persists across updates and reinstalls.
- **macOS Backup Fix.** ZIP import no longer crashes on macOS.

### **Bug Fixes**

- Fixed: ZIP Import overwrites existing data for full recovery
- Fixed: App performs full relaunch after backup import to clear cache

---

## **3.5.0** - The Connections Update (February 2026)

### **New Features**

- **X / Twitter Integration.** Connect your Twitter/X account via OAuth 1.0a. Skales can post tweets, read your timeline, fetch @mentions, and reply to tweets, from the chat interface or via Telegram. Three permission modes: Send Only, Read & Write, Full Autonomous. API keys stored securely locally.
- **Safety Mode.** Three-level command safety system (Safe, Advanced, Unrestricted). Safe mode blocks destructive shell commands (rm -rf, format, dd, fork bombs, etc.) outright. Advanced mode pauses dangerous commands and asks for Approve or Reject. Unrestricted mode disables all blocking for power users.
- **OpenRouter Telegram Vision Fix.** Image uploads via Telegram now work correctly when OpenRouter is the active provider. Skales auto-detects non-vision-capable models and falls back to a vision-capable one.
- **Secure Clipboard Fallback.** Clipboard copy works on HTTP and Tailscale connections (not just HTTPS).

### **Bug Fixes & Improvements**

- Fixed UUID generation breaking on HTTP connections (Tailscale, LAN IPs).
- Fixed mobile input bar disappearing behind the keyboard on iOS and Android.
- Fixed chat scroll-jump when new messages arrive while scrolled up.
- Fixed hydration mismatch on mobile chat page.
- Fixed Telegram memory wordcloud rendering edge case.
- Fixed Playwright cookie banner auto-dismiss not triggering on some pages.
- Improved proactive AI personality. Skales now occasionally initiates conversation based on context.
- Lio AI workspace fixes: invisible projects now visible, chat history preserved across sessions, failed build status resolved.
- Email: Trusted Address Book feature, HTML email rendering, IMAP namespace fix, timezone normalization for event timestamps.
- ElevenLabs TTS fallback chain improved. Now gracefully falls back to Google TTS on API errors.
- macOS: uninstall script renamed for consistency with all other launcher scripts.
- Setup scripts: improved admin rights handling, clearer UX messages, better error reporting.

---

## **3.0.0** - The Power Update (February 2026)

### **New Features**

- **Lio AI - Code Builder.** Multi-AI code builder using Architect, Reviewer, and Builder model pipeline. Build entire apps, websites, and scripts from plain-language descriptions. Navigate to the Code tab to use it.
- **Browser Control.** Headless Chromium automation. Navigate, click, type, scrape, and screenshot any website. Requires Vision Provider.
- **Vision Provider.** Configurable vision model for image analysis, desktop screenshots, and Browser Control. Supports Google, OpenAI, Anthropic, OpenRouter, Groq.
- **Auto-Update System.** One-click update download and installation with progress tracking, automatic backup, and rollback on failure.
- **Group Chat Multi-AI.** Lio AI uses multiple AI models simultaneously for architecture review.
- **Enhanced Memory.** Improved bi-temporal memory system.

### **Bug Fixes & Improvements**

- Fixed Telegram image analysis routing (no longer triggers duplicate reasoning loops)
- Browser Control correctly detects Playwright installation status
- Lio AI time estimates now show realistic values (2-7 min) instead of utopian numbers
- Vision provider label in chat correctly shows active provider name

---

## **2.0.0** - 2026-02-23

### **Added**

* **Message Queue.** Messages are queued when Skales is busy processing. Queued messages are shown in the chat UI with a counter badge. You can cancel individual queued messages or the currently-processing message. Works across Chat, Telegram, and WhatsApp interfaces.

* **Google Calendar Skill.** Read, create, edit, and delete Google Calendar events via OAuth. Skales can check your schedule, add events with reminders, and surface upcoming events as context in every conversation. Configurable in Settings > Skills > Google Calendar.

* **Gmail / Email Skill.** Full IMAP and SMTP email management. Fetch inbox, read threads, compose, reply, search, move, and delete emails. Clean text rendering of HTML emails. Approve and reject safety gates for send and delete operations. New email notifications appear as a banner on the dashboard. Configurable in Settings > Skills > Email.

* **Bi-Temporal Memory System.** Periodic memory scan extracts user preferences, facts, and action items from recent conversations. Memories carry both a valid-time (when the fact is true) and a transaction-time (when it was recorded). Relevant memories are injected as context before every response using local keyword extraction. No external embedding API required.

* **Telegram Admin Interface.** Remote-control Skales from Telegram using inline keyboard menus. Switch providers, models, and personas. Toggle skills on or off. View real-time status. Export conversation data. Admin-only access with PIN protection.

* **Killswitch.** Emergency hard-stop for all AI activity, triggerable via Dashboard button, Telegram `/killswitch` command, or automatically on RAM overload and detected infinite loops. Generates a detailed incident log on the desktop on activation.

* **Multi-Persona Group Chat Skill.** Multiple models with distinct personas discuss a user question in sequential rounds. Fully configurable: participants, language, number of rounds, and personas. Discussions can be exported as Markdown.

* **Autonomous Execute Mode.** Opt-in mode where Skales autonomously handles complex multi-step tasks. Presents a plan for approval, then executes step-by-step with progress updates and approve and reject checkpoints for critical actions (file writes, email sends, deletions). Available via chat and Telegram.

* **Website & Search Security Blacklists.** Domain blocklist prevents Skales from fetching dangerous or inappropriate websites. Word filter blocks harmful search queries before they reach the search API. Both are toggle-controlled in Settings > Security with curated default lists included. Fully customizable from the UI.

* **Responsive UI.** Full mobile and tablet support across the entire dashboard. Collapsible sidebar with overlay, mobile header, touch-optimized controls, and proper viewport handling.

### **Changed**

* Upgraded the internal skill registry to support new skill types (Calendar, Email, Group Chat, Execute Mode).
* Enhanced Telegram handler to support inline keyboard menus and all new admin commands.
* Memory system runs alongside the existing knowledge base (non-breaking additive enhancement).
* Email tools have appropriate approval gates: delete and reply require confirmation, move is automatic.
* Email bodies are converted from HTML to text for cleaner, token-efficient context.
* Dashboard email notification bar shows a single aggregated row (count and latest sender) instead of stacking multiple banners.

### **Fixed**

* Fixed message loss when sending messages while Skales was already processing a response (all messages are now safely queued).
* Fixed security blacklist toggle switches not animating.
* Fixed IMAP MOVE operation fallback on servers that don't support the MOVE extension.

---

## **0.9.0** - 2026-02-19

### **Added**

* **Weather Tool.** Integrated Open-Meteo API for free, keyless 7-day weather forecasts and geocoding.
* **Image Generation Skill.** Integrated Google Imagen 3 via the new Chat Skill Toolbar. Supports multiple aspect ratios and styles.
* **Video Generation Skill.** Integrated Google Veo 2 with asynchronous polling directly in the chat interface.
* **Skills Management Page.** New UI to toggle individual skills (Image Gen, Video Gen, Summarize, Weather) on or off.
* **Chat Skill Toolbar.** Added a "Sparkles" icon to the chat input to access generation panels.
* **Smooth Preloader.** Loading animations (Spin-Ring, Gecko, Bouncing Dots) for better UX.

### **Changed**

* **Persona System Overhaul.** Rewrote all 5 Personas (Default, Entrepreneur, Coder, Family, Student) with deep-dive prompts to give them distinct voices.
* **Agentic Loop Enhancements.** More iterations to handle complex multi-file tasks. Added a visual step-indicator and fixed the stuck-state UI bug.
* **File System Security Toggle.** Added a strict toggle in Settings (Workspace Only vs. Full Access) to sandbox file operations.
* **Self-Awareness (Capabilities Registry v1.4).** Skales can natively audit its own connections, verify identity files, and report on system health via tools.
* **Decoupled Notifications.** The internal scheduler is no longer hard-tied to Telegram, allowing for a universal system inbox.

### **Fixed**

* Fixed Groq TTS issues with a reliable HTTP fallback to Google TTS.
* Auto-switch logic for Vision models correctly triggers when images are pasted or uploaded.
* Fixed the "Enter to send" behavior when images are attached in the chat input.