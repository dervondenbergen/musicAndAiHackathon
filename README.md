# Architecture Soundscapes
Open-Source Public Repository for the Music and AI Hackathon 2025. Challenge #3: Culture & Music

## Team - Pompompurin

Members (alphabeticaly):
 * Alisa Sumwalt (Frontend) - @iggyw1g
 * Bhushith Gujjala Hari (AI) - @teddyboy999
 * Felix De Montis (Frontend, Things) - @dervondenbergen
 * Nona Oi (Backend) - @billie-mp4

## Concept / Idea

**Architecture Image to Soundscape**

Simple web app which translates images to matching soundscapes. The focus should be on Buildings and Architecture, where destinctiv features of a building and its surroundings are the input for the transformation. Each piece of information gets either matched to an existing sound, to create the mood and vibe of the image, catching the ambiance of the photo.

## Basic User Flow

1. our user opens the web app
2. a simple button enables choosing an photo or taking a photo
3. the photo gets previewed and a upload + transformation button gets displayed
4. when pressing the button the files gets uploaded and send to the ✨ **AI** ✨
5. the page gets redirected to a page with an uuid which shows that there is something running in the background
6. once the [transformation](#transformation) is done the page reloads and shows both the image + the soundscape
7. the soundscape can be downloaded or the url can be shared with a button

## Technical Details

### Tech Stack

* API Backend: Express (NodeJS)
* Model Backend: FastAPI (maybe for now)
* Frontend: VueJS SPA
* AI Model: HuggingFace (something image to text)
* Infrastructure: Selfhosted on Uberspace (maybe Vercel?)

### Transformation

…

#### Prompt

…

#### Sounds
