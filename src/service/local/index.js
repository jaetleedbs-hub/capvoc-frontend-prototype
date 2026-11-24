/**
 * 프론트 전용 트랜잭션 진입점.
 * 이 프로토타입은 백엔드 프록시를 호출하지 않고 여기로만 요청을 끝낸다.
 */

export { runLocalRequest, dispatchLocal } from './dispatch';
export { resetDb } from './store';
