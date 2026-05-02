import { MILESTONES } from '../constants.js';
import { img50, img100, img200, img300, img500, img1000 } from '../images.js';

const IMGS = { 50: img50, 100: img100, 200: img200, 300: img300, 500: img500, 1000: img1000 };

export default function MilestoneModal({ pts, onClose }) {
  if (!pts) return null;
  const m = MILESTONES[pts] || { title: 'MILESTONE!', sub: 'Продолжай!' };
  const img = IMGS[pts];

  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="milestone-box" onClick={e => e.stopPropagation()}>
        {img && <img className="milestone-img" src={img} alt="" />}
        <div className="milestone-body">
          <div className="milestone-pts">{pts} ОЧКОВ ЧАДИЗМА</div>
          <div className="milestone-title">{m.title}</div>
          <div className="milestone-sub">{m.sub}</div>
          <button className="btn-milestone" onClick={onClose}>ПРИНЯТО! 💪</button>
        </div>
      </div>
    </div>
  );
}
