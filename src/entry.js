/**
 * entry.js
 * 
 * This is the first file loaded. It sets up the Renderer, 
 * Scene, Physics and Entities. It also starts the render loop and 
 * handles window resizes.
 * 
 */

import * as THREE from 'three'
import {AmmoHelper, Ammo, createConvexHullShape} from './AmmoLib'
import EntityManager from './EntityManager'
import Entity from './Entity'
import Sky from './entities/Sky/Sky2'
import LevelSetup from './entities/Level/LevelSetup'
import PlayerControls from './entities/Player/PlayerControls'
import PlayerPhysics from './entities/Player/PlayerPhysics'
import Stats from 'three/examples/jsm/libs/stats.module'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils'
import NpcCharacterController from './entities/NPC/CharacterController'
import Input from './Input'
import level from './assets/level.glb'
import office from './assets/office.glb'
import navmesh from './assets/navmesh.obj'
import mutant from './assets/animations/mutant.fbx'
import idleAnim from './assets/animations/mutant breathing idle.fbx'
import attackAnim from './assets/animations/Mutant Punch.fbx'
import walkAnim from './assets/animations/mutant walking.fbx'
import runAnim from './assets/animations/mutant run.fbx'
import dieAnim from './assets/animations/mutant dying.fbx'
import ak47 from './assets/guns/ak47/ak47.glb'
import muzzleFlash from './assets/muzzle_flash.glb'
import ak47Shot from './assets/sounds/ak47_shot.wav'
import ammobox from './assets/ammo/AmmoBox.fbx'
import ammoboxTexD from './assets/ammo/AmmoBox_D.tga.png'
import ammoboxTexN from './assets/ammo/AmmoBox_N.tga.png'
import ammoboxTexM from './assets/ammo/AmmoBox_M.tga.png'
import ammoboxTexR from './assets/ammo/AmmoBox_R.tga.png'
import ammoboxTexAO from './assets/ammo/AmmoBox_AO.tga.png'
import decalColor from './assets/decals/decal_c.jpg'
import decalNormal from './assets/decals/decal_n.jpg'
import decalAlpha from './assets/decals/decal_a.jpg'
import skyTex from './assets/sky.jpg'
import DebugDrawer from './DebugDrawer'
import Navmesh from './entities/Level/Navmesh'
import AttackTrigger from './entities/NPC/AttackTrigger'
import DirectionDebug from './entities/NPC/DirectionDebug'
import CharacterCollision from './entities/NPC/CharacterCollision'
import Weapon from './entities/Player/Weapon'
import UIManager from './entities/UI/UIManager'
import AmmoBox from './entities/AmmoBox/AmmoBox'
import LevelBulletDecals from './entities/Level/BulletDecals'
import PlayerHealth from './entities/Player/PlayerHealth'
import PlayerState from './entities/Player/PlayerState'

class FPSGameApp {
    constructor() {
        this.lastFrameTime = null;
        this.assets = {};
        this.animFrameId = 0;
        this.cameraControlEnabled = false; // For terminal camera command
        AmmoHelper.Init(() => { this.Init(); });
    }

    Init() {
        try {
            this.SetupGraphics();
            this.SetupTerminal();
        } catch (error) {
            console.error('Initialization error:', error);
            alert('App initialization failed. See console.');
        }
    }

    SetupGraphics() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.camera = new THREE.PerspectiveCamera();
        this.camera.near = 0.01;

        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.WindowResizeHandler();
        window.addEventListener('resize', this.WindowResizeHandler);

        this.canvasContainer = document.getElementById('canvas-container');
        this.renderer.domElement.id = 'game-canvas';
        this.canvasContainer.appendChild(this.renderer.domElement);

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);
    }

    SetupPhysics() {
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const broadphase = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
        this.physicsWorld.setGravity(new Ammo.btVector3(0.0, -9.81, 0.0));
        const fp = Ammo.addFunction(this.PhysicsUpdate);
        this.physicsWorld.setInternalTickCallback(fp);
        this.physicsWorld.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback());
    }

    SetupTerminal() {
        jQuery(($) => {
            const asciiArt = `
                       *
                      * *
                     *   *
                    * * * *
                   *       *
                  * *     * *
                 *   *   *   *
                * * * * * * * *
               *               *
              * *             * *
             *   *           *   *
            * * * *         * * * *
           *       *       *       *
          * *     * *     * *     * *
         *   *   *   *   *   *   *   *
        * * * * * * * * * * * * * * * *`;

            const quizQuestions = [
                { question: 'What is DeMoD LLC’s motto?', answer: 'Cut the Bullshit, Cut the Price', hint: 'It’s on the homepage!' },
                { question: 'Which OS is developed by DeMoD?', answer: 'ArchibaldOS', hint: 'Check the navigation links.' },
                { question: 'Can a triangular formation, a Sierpinski triangle, be used as an antenna? (yes/no)', answer: 'Yes', hint: 'Think about fractal designs in RF applications.' },
                { question: 'How many simultaneous effects can the DeMoD guitar DSP PCB support?', answer: '3-5', hint: 'Consider the DSP’s processing capabilities.' }
            ];

            const productSlides = [
                `[[b;#fff;]DeMoD LLC: Who We Are]\n\nNo fluff, just raw solutions.\nOur motto: [[b;#fff;]Cut the Bullshit, Cut the Price]`,
                `[[b;#fff;]Our Products]\n\n- [[!;#ff0000;;;https://demod.ltd/archibald.html]ArchibaldOS]: Next-gen operating system.\n- [[!;#ff0000;;;drone.html]Drones]: Advanced drone technology.\n- [[!;#ff0000;;;petabytemadness.html]PetabyteMadness]: Data-driven innovation.`,
                `[[b;#fff;]DeMoD Guitars]\n\nPowered by TMS320C672x DSP.\nSupports [[b;#fff;]3-5 simultaneous effects] (delay, reverb, etc.).`,
                `[[b;#fff;]Drone Imaging]\n\nMultispectral cams for farm monitoring.\nPowered by [[!;#ff0000;;;https://x.ai/api]xAI API] for data analysis.`,
                `[[b;#fff;]Get Involved]\n\nJoin us:\n- [[!;#ff0000;;;https://blog.demod.ltd]Blog]\n- [[!;#ff0000;;;https://im6kgc-tb.myshopify.com/]Shop]\nTry our [[b;#fff;]challenge] command!`
            ];

            const challengeSlides = [
                `[[b;#fff;]SAM'S EYES ONLY]\n\nYo Sam, it’s me, a 135lb, 5’8”, 21-year-old MMA dude, calling out your CANDYMAN ass to spar. Let’s do this.`,
                `[[b;#fff;]Why I’m Coming for You]\n\nYou’re a big dude, Sam, but I ain’t scared. I’m stepping up to show I got more balls than most, ready to take you on.`,
                `[[b;#fff;]Hasan’s a Punk]\n\nHasan Piker’s ducking you, hiding behind his rich boy talk. I’m 65 lbs lighter than that clown, but I’ll still swing at you. Where you at, @hasanthehun?`,
                `[[b;#fff;]My MMA Life]\n\nBeen scrapping in MMA gyms since I was a kid, eating punches from guys twice my size. 135 lbs don’t mean shit when you got heart. I’m ready, Sam.`,
                `[[b;#fff;]Step Up or Shut Up]\n\nThink you got what it takes? Hit up [[!;#ff0000;;;candyman.html]CANDYMAN] and let’s see who’s real. Sam, I’m waiting.`
            ];

            $('#terminal').terminal({
                echo: function(...args) { this.echo(args.join(' ') || ''); },
                help: function() { this.echo('[[b;#fff;]Commands]: echo, help, clear, info, whoami, time, ls, cd, page, search, goto, play, logo, theme, nav, history, quiz, challenge, presentation, camera, newgame'); },
                clear: function() { this.clear(); },
                info: function() { this.echo('[[b;#fff;]DeMoD LLC Terminal v1.0]\nType [[b;#fff;]help] for commands.\n[[!;#ff0000;;;https://demod.ltd]DeMoD LLC Website]'); },
                whoami: function() { this.echo('[[b;#fff;]You’re a DeMoD power user!]'); },
                time: function() { this.echo('[[b;#fff;]' + new Date().toLocaleString() + ']'); },
                ls: function() { this.echo('[[b;#fff;]home  about  blog  shop  wiki]'); },
                cd: function(dir) {
                    try {
                        const sections = ['home', 'about', 'blog', 'shop', 'wiki'];
                        this.echo(dir && sections.includes(dir) ? `[[b;#fff;]Navigated to ${dir}]` : `[[;#ff0000;]Section "${dir || ''}" not found. Try: ${sections.join(', ')}]`);
                    } catch (e) { this.error('Error in cd: ' + e.message); }
                },
                page: function() { this.echo(`[[b;#fff;]Current page: ${window.location.pathname}]`); },
                search: function(term) { this.echo(term ? `[[b;#fff;]Searching for "${term}"... (simulated)]` : '[[;#ff0000;]Enter a search term.]'); },
                goto: function(page) {
                    try {
                        const links = {
                            about: 'about.html',
                            contact: 'wait.html',
                            DeMoD: 'dsp.html',
                            Founder: 'comparison.html',
                            privacy: 'privacy.html',
                            archibaldos: 'archibald.html',
                            drones: 'drone.html',
                            petabytemadness: 'petabytemadness.html',
                            blog: 'https://blog.demod.ltd',
                            wiki: 'wiki.html',
                            thesis: 'article.html',
                            youtube: 'https://www.youtube.com/@demodllc',
                            x: 'https://x.com/demodllc',
                            git: 'https://github.com/ALH477',
                            shop: 'https://im6kgc-tb.myshopify.com/',
                            home: 'home.html',
                            podcasts: 'audio.html',
                            candyman: 'candyman.html',
                            desktop: 'https://daedalos.demod.ltd'
                        };
                        if (links[page]) {
                            window.location.href = links[page];
                            this.echo(`[[b;#fff;]Navigating to ${page}...]`);
                        } else {
                            this.echo(`[[;#ff0000;]Pages: ${Object.keys(links).join(', ')}]`);
                        }
                    } catch (e) { this.error('Error in goto: ' + e.message); }
                },
                play: function(track) {
                    try {
                        const tracks = {
                            track1: document.getElementById('audio-track1'),
                            track2: document.getElementById('audio-track2'),
                            petabyte: document.getElementById('audio-petabyte')
                        };
                        if (track === 'stop') {
                            for (let key in tracks) {
                                if (tracks[key]) {
                                    tracks[key].pause();
                                    tracks[key].currentTime = 0;
                                }
                            }
                            this.echo('[[b;#fff;]Stopped playback.]');
                            return;
                        }
                        if (tracks[track]) {
                            for (let key in tracks) {
                                if (key !== track && tracks[key]) {
                                    tracks[key].pause();
                                    tracks[key].currentTime = 0;
                                }
                            }
                            tracks[track].play().then(() => {
                                this.echo(`[[b;#fff;]Playing ${track}]`);
                            }).catch(error => {
                                this.echo(`[[;#ff0000;]Error playing ${track}: ${error.message}]`);
                            });
                        } else {
                            this.echo('[[;#ff0000;]Tracks: track1, track2, petabyte, or "stop" to stop playback.]');
                        }
                    } catch (e) { this.error('Error in play: ' + e.message); }
                },
                logo: function() { this.echo(asciiArt); },
                theme: function(theme) {
                    try {
                        const $term = $('#terminal');
                        if (theme === 'red') {
                            $term.addClass('red-theme');
                            this.echo('[[b;#f88;]Theme set to red]');
                        } else if (theme === 'white') {
                            $term.removeClass('red-theme');
                            this.echo('[[b;#fff;]Theme set to white]');
                        } else {
                            this.echo('[[;#ff0000;]Themes: red, white]');
                        }
                    } catch (e) { this.error('Error in theme: ' + e.message); }
                },
                camera: function() {
                    try {
                        this.cameraControlEnabled = !this.cameraControlEnabled;
                        if (!this.cameraControlEnabled) document.exitPointerLock();
                        this.echo(`[[b;#fff;]Camera controls (WASD, mouse, touch) ${this.cameraControlEnabled ? 'enabled' : 'disabled'}]`);
                    } catch (e) { this.error('Error in camera: ' + e.message); }
                },
                nav: function() {
                    try {
                        const categories = {
                            'Company': [
                                { name: 'About', url: 'about.html' },
                                { name: 'Contact', url: 'wait.html' },
                                { name: 'Founder', url: 'comparison.html' },
                                { name: 'Privacy', url: 'privacy.html' }
                            ],
                            'Products': [
                                { name: 'ArchibaldOS', url: 'archibald.html' },
                                { name: 'Drones', url: 'drone.html' },
                                { name: 'DeMoD', url: 'dsp.html' },
                                { name: 'PetabyteMadness', url: 'petabytemadness.html' }
                            ],
                            'Resources': [
                                { name: 'Blog', url: 'https://blog.demod.ltd' },
                                { name: 'Wiki', url: 'wiki.html' },
                                { name: 'Thesis', url: 'article.html' }
                            ],
                            'Social': [
                                { name: 'Youtube', url: 'https://www.youtube.com/@demodllc' },
                                { name: 'X', url: 'https://x.com/demodllc' },
                                { name: 'Git', url: 'https://github.com/ALH477' }
                            ],
                            'Shop': [
                                { name: 'Shop', url: 'https://im6kgc-tb.myshopify.com/' }
                            ],
                            'Other': [
                                { name: 'Home', url: 'home.html' },
                                { name: 'Podcasts & Music', url: 'audio.html' },
                                { name: 'CANDYMAN', url: 'candyman.html' },
                                { name: 'Desktop', url: 'https://daedalos.demod.ltd' }
                            ]
                        };
                        this.echo('<div class="nav-list">');
                        for (let category in categories) {
                            this.echo(`[[b;#fff;]${category}]`);
                            categories[category].forEach(link => {
                                this.echo(`- [[!;#ff0000;;;${link.url}]${link.name}]`);
                            });
                        }
                        this.echo('</div>');
                        setTimeout(() => $('.nav-list').addClass('show'), 0);
                    } catch (e) { this.error('Error in nav: ' + e.message); }
                },
                history: function() {
                    try {
                        const hist = this.history().get();
                        this.echo(hist.length ? `[[b;#fff;]${hist.join('\n')}]` : '[[;#ff0000;]No history.]');
                    } catch (e) { this.error('Error in history: ' + e.message); }
                },
                quiz: function() {
                    try {
                        let currentQuestion = 0, score = 0;
                        this.echo(`[[b;#fff;]${quizQuestions[currentQuestion].question}]`);
                        this.push(input => {
                            if (input.toLowerCase() === 'hint') {
                                this.echo(`[[b;#fff;]Hint: ${quizQuestions[currentQuestion].hint}]`);
                                return;
                            }
                            if (input.toLowerCase() === quizQuestions[currentQuestion].answer.toLowerCase()) {
                                this.echo('[[b;#fff;]Correct!]');
                                score++;
                            } else {
                                this.echo(`[[;#ff0000;]Incorrect. Answer: ${quizQuestions[currentQuestion].answer}]`);
                            }
                            currentQuestion++;
                            if (currentQuestion < quizQuestions.length) {
                                this.echo(`[[b;#fff;]${quizQuestions[currentQuestion].question}]`);
                            } else {
                                this.echo(`[[b;#fff;]Quiz done! Score: ${score}/${quizQuestions.length}]`);
                                this.pop();
                            }
                        }, { prompt: '[[b;#fff;]Answer (or "hint"): ]' });
                    } catch (e) { this.error('Error in quiz: ' + e.message); }
                },
                presentation: function() {
                    try {
                        let currentSlide = 0;
                        this.clear();
                        this.echo(productSlides[currentSlide]);
                        this.push(input => {
                            input = input.toLowerCase();
                            if (input === 'next' && currentSlide < productSlides.length - 1) {
                                currentSlide++;
                                this.clear();
                                this.echo(productSlides[currentSlide]);
                            } else if (input === 'prev' && currentSlide > 0) {
                                currentSlide--;
                                this.clear();
                                this.echo(productSlides[currentSlide]);
                            } else if (input === 'first') {
                                currentSlide = 0;
                                this.clear();
                                this.echo(productSlides[currentSlide]);
                            } else if (input === 'last') {
                                currentSlide = productSlides.length - 1;
                                this.clear();
                                this.echo(productSlides[currentSlide]);
                            } else if (input.startsWith('jump ')) {
                                const num = parseInt(input.split(' ')[1]);
                                if (num >= 1 && num <= productSlides.length) {
                                    currentSlide = num - 1;
                                    this.clear();
                                    this.echo(productSlides[currentSlide]);
                                } else {
                                    this.echo(`[[;#ff0000;]Invalid slide. Use 1-${productSlides.length}.]`);
                                }
                            } else if (input === 'demo') {
                                this.echo('[[b;#fff;]Demo mode not available.]');
                            } else if (input === 'exit') {
                                this.echo('[[b;#fff;]Presentation ended.]');
                                this.pop();
                            } else {
                                this.echo(`[[;#ff0000;]Use: next, prev, first, last, jump [1-${productSlides.length}], exit]`);
                            }
                        }, { prompt: `[[b;#fff;]Slide ${currentSlide + 1}/${productSlides.length} (next/prev/first/last/jump/exit): ]` });
                    } catch (e) { this.error('Error in presentation: ' + e.message); }
                },
                challenge: function() {
                    try {
                        let currentSlide = 0;
                        this.clear();
                        this.echo(challengeSlides[currentSlide]);
                        this.push(input => {
                            input = input.toLowerCase();
                            if (input === 'next' && currentSlide < challengeSlides.length - 1) {
                                currentSlide++;
                                this.clear();
                                this.echo(challengeSlides[currentSlide]);
                            } else if (input === 'prev' && currentSlide > 0) {
                                currentSlide--;
                                this.clear();
                                this.echo(challengeSlides[currentSlide]);
                            } else if (input === 'first') {
                                currentSlide = 0;
                                this.clear();
                                this.echo(challengeSlides[currentSlide]);
                            } else if (input === 'last') {
                                currentSlide = challengeSlides.length - 1;
                                this.clear();
                                this.echo(challengeSlides[currentSlide]);
                            } else if (input.startsWith('jump ')) {
                                const num = parseInt(input.split(' ')[1]);
                                if (num >= 1 && num <= challengeSlides.length) {
                                    currentSlide = num - 1;
                                    this.clear();
                                    this.echo(challengeSlides[currentSlide]);
                                } else {
                                    this.echo(`[[;#ff0000;]Invalid slide. Use 1-${challengeSlides.length}.]`);
                                }
                            } else if (input === 'exit') {
                                this.echo('[[b;#fff;]Challenge ended.]');
                                this.pop();
                            } else {
                                this.echo(`[[;#ff0000;]Use: next, prev, first, last, jump [1-${challengeSlides.length}], exit]`);
                            }
                        }, { prompt: `[[b;#fff;]Slide ${currentSlide + 1}/${challengeSlides.length} (next/prev/first/last/jump/exit): ]` });
                    } catch (e) { this.error('Error in challenge: ' + e.message); }
                },
                newgame: function() {
                    try {
                        this.echo('[[b;#fff;]Initiating 3D scene showcase...]');
                        $('#terminal').hide();
                        $('#canvas-container').show();
                        this.StartGame();
                    } catch (e) {
                        this.error('Error starting game: ' + e.message);
                        $('#terminal').show();
                    }
                }
            }, {
                greetings: `[[b;#fff;]DeMoD LLC Terminal]\n${asciiArt}\n[[b;#fff;]Type "newgame" to start the 3D scene. Use "help" for other commands.]`,
                prompt: '[[b;#fff;]DeMoD> ]',
                completions: function() {
                    return ['echo', 'help', 'clear', 'info', 'whoami', 'time', 'ls', 'cd', 'page', 'search', 'goto', 'play', 'logo', 'theme', 'nav', 'history', 'quiz', 'challenge', 'presentation', 'camera', 'newgame'];
                },
                onCommandNotFound: function(cmd) { this.echo(`[[;#ff0000;]Command "${cmd}" not found. Type "help".]`); },
                exceptionHandler: (e) => {
                    console.error('Terminal error:', e);
                    this.error('An error occurred in the terminal.');
                }
            });

            $(document).keydown(e => {
                if (e.key === '`' || e.key === '~') {
                    e.preventDefault();
                    $('#terminal').toggle();
                    if ($('#terminal').is(':visible')) $('#terminal').focus();
                    if (this.cameraControlEnabled && !$('#terminal').is(':visible')) {
                        document.querySelector('#game-canvas').requestPointerLock();
                    }
                } else if (e.key === 'Escape') {
                    $('#terminal').hide();
                }
            });
        });
    }

    SetAnim(name, obj) {
        const clip = obj.animations[0];
        this.mutantAnims[name] = clip;
    }

    PromiseProgress(proms, progress_cb) {
        let d = 0;
        progress_cb(0);
        for (const p of proms) {
            p.then(() => {
                d++;
                progress_cb((d / proms.length) * 100);
            });
        }
        return Promise.all(proms);
    }

    AddAsset(asset, loader, name) {
        return loader.loadAsync(asset).then(result => {
            this.assets[name] = result;
        }).catch(error => {
            throw new Error(`Failed to load asset ${name}: ${error.message}`);
        });
    }

    OnProgress(p) {
        const progressbar = document.getElementById('progress');
        progressbar.style.width = `${p}%`;
    }

    HideProgress() {
        this.OnProgress(0);
    }

    ShowMenu(visible = true) {
        $('#terminal').css('visibility', visible ? 'visible' : 'hidden');
    }

    async LoadAssets() {
        const gltfLoader = new GLTFLoader();
        const fbxLoader = new FBXLoader();
        const objLoader = new OBJLoader();
        const audioLoader = new THREE.AudioLoader();
        const texLoader = new THREE.TextureLoader();
        const promises = [];

        promises.push(this.AddAsset(level, gltfLoader, "level"));
        promises.push(this.AddAsset(office, gltfLoader, "office"));
        promises.push(this.AddAsset(navmesh, objLoader, "navmesh"));
        promises.push(this.AddAsset(mutant, fbxLoader, "mutant"));
        promises.push(this.AddAsset(idleAnim, fbxLoader, "idleAnim"));
        promises.push(this.AddAsset(walkAnim, fbxLoader, "walkAnim"));
        promises.push(this.AddAsset(runAnim, fbxLoader, "runAnim"));
        promises.push(this.AddAsset(attackAnim, fbxLoader, "attackAnim"));
        promises.push(this.AddAsset(dieAnim, fbxLoader, "dieAnim"));
        promises.push(this.AddAsset(ak47, gltfLoader, "ak47"));
        promises.push(this.AddAsset(muzzleFlash, gltfLoader, "muzzleFlash"));
        promises.push(this.AddAsset(ak47Shot, audioLoader, "ak47Shot"));
        promises.push(this.AddAsset(ammobox, fbxLoader, "ammobox"));
        promises.push(this.AddAsset(ammoboxTexD, texLoader, "ammoboxTexD"));
        promises.push(this.AddAsset(ammoboxTexN, texLoader, "ammoboxTexN"));
        promises.push(this.AddAsset(ammoboxTexM, texLoader, "ammoboxTexM"));
        promises.push(this.AddAsset(ammoboxTexR, texLoader, "ammoboxTexR"));
        promises.push(this.AddAsset(ammoboxTexAO, texLoader, "ammoboxTexAO"));
        promises.push(this.AddAsset(decalColor, texLoader, "decalColor"));
        promises.push(this.AddAsset(decalNormal, texLoader, "decalNormal"));
        promises.push(this.AddAsset(decalAlpha, texLoader, "decalAlpha"));
        promises.push(this.AddAsset(skyTex, texLoader, "skyTex"));

        try {
            await this.PromiseProgress(promises, this.OnProgress);
        } catch (error) {
            console.error('Asset loading failed:', error);
            alert('Failed to load assets. Check console for details.');
            this.ShowMenu(true);
            throw error;
        }

        this.assets['level'] = this.assets['level'].scene;
        this.assets['office'] = this.assets['office'].scene;
        this.assets['muzzleFlash'] = this.assets['muzzleFlash'].scene;

        this.mutantAnims = {};
        this.SetAnim('idle', this.assets['idleAnim']);
        this.SetAnim('walk', this.assets['walkAnim']);
        this.SetAnim('run', this.assets['runAnim']);
        this.SetAnim('attack', this.assets['attackAnim']);
        this.SetAnim('die', this.assets['dieAnim']);

        this.assets['ak47'].scene.animations = this.assets['ak47'].animations;

        this.assets['ammobox'].scale.set(0.01, 0.01, 0.01);
        this.assets['ammobox'].traverse(child => {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({
                map: this.assets['ammoboxTexD'],
                aoMap: this.assets['ammoboxTexAO'],
                normalMap: this.assets['ammoboxTexN'],
                metalness: 1,
                metalnessMap: this.assets['ammoboxTexM'],
                roughnessMap: this.assets['ammoboxTexR'],
                color: new THREE.Color(0.4, 0.4, 0.4)
            });
        });

        this.assets['ammoboxShape'] = createConvexHullShape(this.assets['ammobox']);

        this.HideProgress();
    }

    LoadLevel(levelName) {
        try {
            const levelEnt = this.entityManager.Get('Level');
            if (levelEnt) {
                levelEnt.GetComponent('LevelSetup').Dispose();
                this.entityManager.entities = this.entityManager.entities.filter(e => e.Name !== 'Level' && !e.Name.startsWith('Mutant') && !e.Name.startsWith('AmmoBox'));
            }

            const asset = this.assets[levelName];
            if (!asset) throw new Error(`Level ${levelName} not found`);
            const levelEntity = new Entity();
            levelEntity.SetName('Level');
            levelEntity.AddComponent(new LevelSetup(asset, this.scene, this.physicsWorld));
            this.entityManager.Add(levelEntity);
            this.entityManager.EndSetup();
        } catch (error) {
            console.error(`Failed to load level ${levelName}:`, error);
            alert(`Failed to load level ${levelName}. Check console.`);
            this.ShowMenu(true);
            throw error;
        }
    }

    EntitySetup() {
        this.entityManager = new EntityManager();

        const levelEntity = new Entity();
        levelEntity.SetName('Level');
        levelEntity.AddComponent(new LevelSetup(this.assets['level'], this.scene, this.physicsWorld));
        levelEntity.AddComponent(new Navmesh(this.scene, this.assets['navmesh']));
        levelEntity.AddComponent(new LevelBulletDecals(this.scene, this.assets['decalColor'], this.assets['decalNormal'], this.assets['decalAlpha']));
        this.entityManager.Add(levelEntity);

        const skyEntity = new Entity();
        skyEntity.SetName("Sky");
        skyEntity.AddComponent(new Sky(this.scene, this.assets['skyTex']));
        this.entityManager.Add(skyEntity);

        const playerEntity = new Entity();
        playerEntity.SetName("Player");
        playerEntity.AddComponent(new PlayerPhysics(this.physicsWorld, Ammo));
        playerEntity.AddComponent(new PlayerControls(this.camera, this.scene));
        playerEntity.AddComponent(new Weapon(this.camera, this.assets['ak47'].scene, this.assets['muzzleFlash'], this.physicsWorld, this.assets['ak47Shot'], this.listener));
        playerEntity.AddComponent(new PlayerHealth());
        playerEntity.AddComponent(new PlayerState());
        playerEntity.SetPosition(new THREE.Vector3(2.14, 1.48, -1.36));
        playerEntity.SetRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5));
        this.entityManager.Add(playerEntity);

        const npcLocations = [
            [10.8, 0.0, 22.0]
        ];

        npcLocations.forEach((v, i) => {
            const npcEntity = new Entity();
            npcEntity.SetPosition(new THREE.Vector3(v[0], v[1], v[2]));
            npcEntity.SetName(`Mutant${i}`);
            npcEntity.AddComponent(new NpcCharacterController(SkeletonUtils.clone(this.assets['mutant']), this.mutantAnims, this.scene, this.physicsWorld));
            npcEntity.AddComponent(new AttackTrigger(this.physicsWorld));
            npcEntity.AddComponent(new CharacterCollision(this.physicsWorld));
            npcEntity.AddComponent(new DirectionDebug(this.scene));
            this.entityManager.Add(npcEntity);
        });

        const uimanagerEntity = new Entity();
        uimanagerEntity.SetName("UIManager");
        uimanagerEntity.AddComponent(new UIManager());
        this.entityManager.Add(uimanagerEntity);

        const ammoLocations = [
            [14.37, 0.0, 10.45],
            [32.77, 0.0, 33.84]
        ];

        ammoLocations.forEach((loc, i) => {
            const box = new Entity();
            box.SetName(`AmmoBox${i}`);
            box.AddComponent(new AmmoBox(this.scene, this.assets['ammobox'].clone(), this.assets['ammoboxShape'], this.physicsWorld));
            box.SetPosition(new THREE.Vector3(loc[0], loc[1], loc[2]));
            this.entityManager.Add(box);
        });

        this.entityManager.EndSetup();
        this.scene.add(this.camera);
        this.animFrameId = window.requestAnimationFrame(this.OnAnimationFrameHandler);
    }

    StartGame = async () => {
        try {
            await this.LoadAssets();
            window.cancelAnimationFrame(this.animFrameId);
            Input.ClearEventListners();
            this.canvasContainer.style.display = 'block';
            this.scene.clear();
            this.SetupPhysics();
            this.EntitySetup();
            this.ShowMenu(false);
        } catch (error) {
            console.error('Game start error:', error);
            alert('Failed to start scene. Reload and try again.');
            this.ShowMenu(true);
        }
    }

    WindowResizeHandler = () => {
        const { innerHeight, innerWidth } = window;
        this.renderer.setSize(innerWidth, innerHeight);
        this.camera.aspect = innerWidth / innerHeight;
        this.camera.updateProjectionMatrix();
    }

    OnAnimationFrameHandler = (t) => {
        if (this.lastFrameTime === null) {
            this.lastFrameTime = t;
        }
        const delta = t - this.lastFrameTime;
        let timeElapsed = Math.min(1.0 / 30.0, delta * 0.001);
        this.Step(timeElapsed);
        this.lastFrameTime = t;
        this.animFrameId = window.requestAnimationFrame(this.OnAnimationFrameHandler);
    }

    PhysicsUpdate = (world, timeStep) => {
        this.entityManager.PhysicsUpdate(world, timeStep);
    }

    Step(elapsedTime) {
        this.physicsWorld.stepSimulation(elapsedTime, 10);
        this.entityManager.Update(elapsedTime);
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }
}

let _APP = null;
window.addEventListener('DOMContentLoaded', () => {
    _APP = new FPSGameApp();
});
