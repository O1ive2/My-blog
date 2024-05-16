## 为什么要使用SSO单点登录

可以让新应用的账号绑定现有的IT账号，从而不需要自己维护一个用户池，当然也可以做到通过微信、github...登录。我们的IT账号的平台是ovirt平台，该平台基于OAuth2.0协议可以实现外部应用单点登录，同时OAuth2.0能够保证api的安全。

## 前置步骤

单点登录方案一组用户池可能需要面对很多应用，比如我司的IT账号用户池，可能需要面对譬如:gitlab，jenkins,ftp-server...等等诸多应用，这些应用都可以通过IT账号登录，因此要使用IT账号单点登录，首先需要创建一个新的应用（这一步需要IT进行配合，如有需要，请联系谷总）

首先需要约定一个新应用的域名，例如：ftpadmin.raina.tech，并产生一个client_id和client_secret，这两个信息能够帮助ovirt识别当前应用，防止外来应用滥用，也是单点登录的基础，因此需要妥善保管。

## ID Token

对 OAuth2.0最主要的一个扩展就是 ID Token 数据结构。ID Token 相当于用户的身份凭证，开发者的前端访问后端接口时可以携带 ID Token，开发者服务器可以校验用户的 ID Token 以确定用户身份，验证通过后返回相关资源，id token本质上就是jwt token，将其解析可获得用户信息相关的键值对，解析出来的内容如下：

> ```Bash
> {
>   "sub": "601ad46d0a3d171f*****",
>   "birthdate": null,
>   "family_name": null,
>   "gender": "U",
>   "given_name": null,
>   "locale": null,
>   "middle_name": null,
>   "name": "wanhaoyi",
>   "nickname": null,
>   "picture": "https://files.authing.co/authing-console/default-user-avatar.png",
>   "preferred_username": "Oliver",
>   "profile": null,
>   "updated_at": "2021-02-04T05:02:25.932Z",
>   "at_hash": "xnpHKuO1peDcJzbB8xBe4w",
>   "aud": "601ad382d02a2ba94cf996c4",
>   "exp": 1613624613,
>   "iat": 1612415013,
>   "iss": "https://oidc1.authing.cn/oidc"
> }
> ```

## Access Token

用户认证授权成功后，除了返回IDtoken，还会返回accessToken,应用可携带AccessToken访问资源API，其本质也是jwt，解析出来示例如下：

```Bash
{
  "jti": "YEeiX17iDgNwH*****",
  "sub": "601ad46d0a3d171f611164ce",
  "iat": 1612415013,
  "exp": 1613624613,
  "scope": "openid profile offline_access",
  "iss": "https://yelexin-test1.authing.cn/oidc",
  "aud": "601ad3***02a2ba94cf996c4"
}
```

## ID Token vs Access Token

两者都是在用户认证成功之后返回的。

ID token用来做认证，比如可通过id token解析出来的用户信息，展示用户名和头像。

而Access Token是用来访问资源API的，比如当前用户登录成功后，ovirt返回了accesstoken，当应用想要去修改一些用户数据，比如修改当前用户的头像，就需要携带AccessToken访问ovirt的修改头像接口。

## 那么该如何获取上述Token呢？

以下是基于FTP-server和ftp-server-gui的一种实现方案：

首先我们需要提供一个回调地址redirect_url，这个地址会在sso登录成功以后，ovirt会自动通过get请求访问这个url，并会携带一些query参数在回调地址中：code,session_state...下文会有提到参数的用途。

这个回调地址在本次方案中由前端提供，前端提供一个路由，假设是/auth/callback。当sso登录成功以后，会进入这个回调地址/auth/callback，在/auth/callback中，会发起请求访问后端提供的接口(此处的后端指的是ftp-server)，该接口需要前端提供ovrit访问/auth/callback携带的参数code

至此，后端已经获取到为了得到token所需要的所有参数，包括：client_id, client_secret（ovirt生成）, code（ovirt访问回调地址携带）, redirect_url（应用提供）。除此以外，还需要一个固定请求参数grant_type，在ftp-server中，该参数值为'authorization_code'（其余值可以参考：https://oauth.net/2/grant-types/）

通过post请求访问http://ovirt.raina.com/ovirt-engine-auth/realms/ovirt-internal/protocol/openid-connect/token，再请求体携带上述参数，即可从ovirt获取到idToken和accessToken.

获取到token以后，也代表用户身份认证成功，后续需求就可灵活拓展了。

## 流程图

![](https://puj177tssn.feishu.cn/space/api/box/stream/download/asynccode/?code=NTcwOThkYmVkNWE2YjBlMWUxYTc4ZWY5OTZiZjI3NTRfV1pHNWdabEUzRkdRcXB3OWNiUkZBOWFST3NVNFNZWDBfVG9rZW46RWtlY2I3ZUFMb1A5VW14aklhcGNJODlRblNnXzE3MTU4Mzk5NDQ6MTcxNTg0MzU0NF9WNA)
