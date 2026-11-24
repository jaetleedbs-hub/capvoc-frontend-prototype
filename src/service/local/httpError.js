/**
 * 로컬 목업이 브라우저에 돌려주는 HTTP 오류.
 * TransManager.commonCallback 이 axios 오류와 같은 자리(err.response)를 보므로
 * status 와 data 를 그 모양으로 맞춘다.
 */
export class LocalHttpError extends Error {
  constructor(status, data) {
    const body = data && typeof data === 'object' ? data : { message: String(data || '') };
    super(body.message || '요청을 처리하지 못했습니다.');
    this.name = 'LocalHttpError';
    this.response = {
      status,
      data: { status, ...body },
    };
  }
}
