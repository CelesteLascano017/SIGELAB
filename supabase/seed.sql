-- SIGELAB demo catalog (no users here; demo users/requests: scripts/seed-demo.ts)
insert into public.labs (code, name, building, floor, room, capacity, computers_count, has_projector, software, extra_equipment) values
 ('LAB-01','Lab. Ingeniería de Software A','Edificio FIS','Piso 2','Aula A-201',30,30,true,array['VS Code','Docker','Git','Node.js'],array['Pizarra inteligente']),
 ('LAB-02','Lab. Ingeniería de Software B','Edificio FIS','Piso 2','Aula A-202',28,28,true,array['VS Code','Docker','Git','Java JDK'],null),
 ('LAB-03','Lab. Redes y Conectividad','Edificio FIS','Planta baja','Aula A-105',24,12,true,array['Cisco Packet Tracer','Wireshark'],array['Switches Cisco','Routers','Rack de red']),
 ('LAB-04','Lab. Sistemas Operativos','Edificio FIS','Planta baja','Aula A-103',30,30,true,array['Ubuntu','VirtualBox'],null),
 ('LAB-05','Lab. Hardware y Electrónica','Edificio FIS','Subsuelo','Aula B-010',20,0,false,null,array['Osciloscopios','Fuentes de poder','Kits Arduino']),
 ('LAB-06','Lab. Inteligencia Artificial','Edificio FIS','Piso 3','Aula A-305',16,16,true,array['Python','PyTorch','Jupyter'],array['Servidor GPU']),
 ('LAB-07','Sala Multimedia','Edificio FIS','Piso 1','Sala B-201',40,null,true,null,array['Sistema de audio']),
 ('LAB-08','Lab. Bases de Datos','Edificio FIS','Piso 1','Aula B-105',26,26,true,array['PostgreSQL','DBeaver'],null)
on conflict (code) do nothing;

-- Weekly classes (ISO weekday 1=Mon): occupy slots so "Clase" status appears
insert into public.class_schedules (lab_id, weekday, slot_id, subject)
select l.id, v.weekday, v.slot_id, v.subject from public.labs l
join (values
  ('LAB-01', 2::smallint, 4::smallint, 'Programación II'),
  ('LAB-01', 2::smallint, 5::smallint, 'Programación II'),
  ('LAB-02', 2::smallint, 1::smallint, 'Ingeniería de Software'),
  ('LAB-02', 2::smallint, 2::smallint, 'Ingeniería de Software'),
  ('LAB-02', 2::smallint, 3::smallint, 'Ingeniería de Software'),
  ('LAB-04', 2::smallint, 1::smallint, 'Sistemas Operativos'),
  ('LAB-04', 2::smallint, 2::smallint, 'Sistemas Operativos')
) as v(code, weekday, slot_id, subject) on v.code = l.code
on conflict do nothing;
