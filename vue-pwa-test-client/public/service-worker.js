const CACHE_STATIC_NAME = 'static-seul-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-seul-v2';

//precaching 할 파일들
const STATIC_FILES=[
    '/',
    '/favicon.ico',
    '/js/app.js',
    '/js/chunk-vendors.js',
    '/js/about.js',
    '/manifest.json',
    '/img/logo.png',
    '/img/icons/android-chrome-192x192.png',
    '/img/icons/favicon-32x32.png'
];

//precaching 된 request인지 아닌지 확인하는 함수
function isInStaticFiles(string) {
    let cachePath;
  
    //만약 app이 serve되는 domain 주소가 포함되면 self.origin 부분 제거
    if(string.indexOf(self.origin) === 0) {
      cachePath = string.substring(self.origin.length);
    } else {
      cachePath = string;
    }
  
    return STATIC_FILES.indexOf(cachePath) > -1;
  }
  
//service worker가 install 될 때 event 발생
self.addEventListener('install', event => {
    console.log("Service worker Installing!");

    event.waitUntil(
        //cache 저장소 open
        caches.open(CACHE_STATIC_NAME)
          .then( cache => {
            //static 파일 cache!
            cache.addAll(STATIC_FILES);
          })
      )
  });

  //service worker가 activate 되었을 때 이벤트 발생
self.addEventListener('activate', event => {
    console.log("Service worker Activating!");
    //이전에 존재하는 cache 삭제(static & dynamic cache 제외)
    event.waitUntil(
        caches.keys()
        .then( keyList => {
            return Promise.all(keyList.map( key => {
            if(key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                console.log('Removing old cache', key);
                return caches.delete(key);
            }
            }));
        })
    );
    return self.clients.claim();
  });

self.addEventListener('fetch', event => {
    const url = 'https://jsonplaceholder.typicode.com/posts',
        request = event.request;
    let response;
    console.log("Fetching somthing!!", request.url);


  //일단 방명록 목록을 불러오는 request를 무조건 서버로 보내고 이에 대한 response를 cache!
  if(request.method === 'GET' && request.url.startsWith(url)) {
    response = caches.open(CACHE_DYNAMIC_NAME)
      .then( cache => {
        return fetch(request)
          .then( res => {
            cache.put(request, res.clone());
            return res;
          });
      });
  } else if(isInStaticFiles(request.url)) {
    //precaching 된 request는 서버로 요청 보내지 않고 cache된 response로 제공
    response = caches.match(event.request);
  } else {
    //cache에 있으면 cache 데이터 제공 & 없으면 서버 요청
    response = caches.match(request)
      .then( res => {
        if(res) {
          return res;
        } else {
          return fetch(request)
            .then( r => {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then( cache => {
                  if(!request.url.startsWith('chrome')) {
                    cache.put(request.url, r.clone());
                  }
                  return r;
                });
            })
        }
      })
      .catch( err => {
        //서버로의 request 실패시 fallback page 제공
        return caches.open(CACHE_STATIC_NAME)
          .then( cache => {
            //만약, 요청이 text/html 이라면 /offline 을 대신 response
            if(event.request.headers.get('accept').includes('text/html')) {
              return cache.match('/offline');
            }
          })
      })
  }
  event.respondWith(response);

    // event.respondWith(
    //     //항상 서버로 요청 보냄
    //     fetch(event.request)
    //     .then( res => {
    //         //cache에 response 저장
    //         return caches.open(CACHE_DYNAMIC_NAME)
    //                 .then( cache => {
    //                     cache.put(event.request.url, res.clone());
    //                     return res;
    //                 })
    //     })
    //     .catch( err => {
    //         //server로의 요청 실패 -> cache에서 찾음
    //         return caches.match(event.request);
    //     })
    // )
});