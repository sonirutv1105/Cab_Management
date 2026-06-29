from sqlalchemy import create_engine, text
engine = create_engine('mysql+pymysql://root:@localhost:3306/cab_management')
with engine.connect() as conn:
    print([r[0] for r in conn.execute(text('DESCRIBE drivers')).fetchall()])
