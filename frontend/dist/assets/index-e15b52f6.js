(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))r(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const n of e.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function o(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?e.credentials="include":t.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function r(t){if(t.ep)return;t.ep=!0;const e=o(t);fetch(t.href,e)}})();/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */var i=/["'&<>]/,l=m;function m(a){var s=""+a,o=i.exec(s);if(!o)return s;var r,t="",e=0,n=0;for(e=o.index;e<s.length;e++){switch(s.charCodeAt(e)){case 34:r="&quot;";break;case 38:r="&amp;";break;case 39:r="&#39;";break;case 60:r="&lt;";break;case 62:r="&gt;";break;default:continue}n!==e&&(t+=s.substring(n,e)),n=e+1,t+=r}return n!==e?t+s.substring(n,e):t}const u="http://localhost:8411";function p(){const a=document.querySelector(".chat");let s=new Date,r=`<div class="chat-message" data-isbot="false" data-iscommand="false"> <span class="timestamp">${`${s.getHours()}:${s.getMinutes()}`}</span> <span class="author" style="color: #FF0000">JstJxel</span> <span class="message">Willkommen im Chat</span></div>`;a.innerHTML=r}p();const c=new EventSource(u+"/comment-sync");function d(a){let s=document.querySelector(".chat"),o=new Date(a.timestamp);console.log(o),a.timestamp=`${o.getHours()}:${o.getMinutes()}`;let r=`<div class="chat-message"> <span class="timestamp">${a.timestamp}</span> <span class="author" style="color: ${a.color}">${l(a.author)}</span> <span class="message">${l(a.message)}</span></div>`;s.innerHTML+=r}c.onmessage=a=>{let s=JSON.parse(a.data);d(s)};c.onerror=a=>{console.log("Error"),c.close()};
