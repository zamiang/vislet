import datetime
import pendulum
import os
import requests
from airflow.decorators import dag, task
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.postgres.operators.postgres import PostgresOperator
import pandas as pd
import boto3
from io import StringIO
import io


@dag(
    schedule_interval="0 0 * * *",
    start_date=pendulum.datetime(2021, 1, 1, tz="UTC"),
    catchup=False,
    dagrun_timeout=datetime.timedelta(minutes=60),
)
def Etl():
    create_sales_table = PostgresOperator(
        task_id="create_sales_table",
        postgres_conn_id="vislet_create_pg_conn",
        sql="""
        CREATE TABLE IF NOT EXISTS sales (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            neighborhood TEXT,
            building_class_category TEXT,
            block INTEGER,
            lot INTEGER,
            building_class TEXT,
            address TEXT,
            apartment_number TEXT,
            residential_units INTEGER,
            commercial_units INTEGER,
            land_sq_ft INTEGER,
            gross_sq_ft INTEGER,
            year_built INTEGER,
            sale_price INTEGER,
            sale_date DATE,
        );""",
    )

    @task
    def get_data():
        # Accessing the S3 buckets using boto3 client
        s3_client = boto3.client('s3')

        s3_bucket_name = 'vislet-dags'
        access_key_id = os.environ.get['AWS_ACCESS_KEY_ID']
        secret_access_key = os.environ.get['AWS_SECRET_ACCESS_KEY']

        s3 = boto3.resource('s3',
                            aws_access_key_id=access_key_id,
                            aws_secret_access_key=secret_access_key)

        # Getting data files from the AWS S3 bucket as denoted above and printing the first 10 file names
        my_bucket = s3.Bucket(s3_bucket_name)
        bucket_list = []
        for file in my_bucket.objects.filter(Prefix='brooklyn_'):
            file_name = file.key
            if file_name.find(".csv") != -1:
                bucket_list.append(file.key)

        # Initializing empty list of dataframes
        converted_df = pd.DataFrame(columns=[
            'BOROUGH', 'NEIGHBORHOOD', 'BUILDING CLASS CATEGORY', 'TAX CLASS AT PRESENT', 'BLOCK', 'LOT', 'EASE-MENT', 'BUILDING CLASS AT PRESENT', 'ADDRESS', 'APARTMENT NUMBER', 'ZIP CODE', 'RESIDENTIAL UNITS', 'COMMERCIAL UNITS', 'TOTAL UNITS', 'LAND SQUARE FEET', 'GROSS SQUARE FEET', 'YEAR BUILT', 'TAX CLASS AT TIME OF SALE', 'BUILDING CLASS AT TIME OF SALE', 'SALE PRICE', 'SALE DATE'
        ])

        df = []
        for file in bucket_list:
            obj = s3.Object(s3_bucket_name, file)
            data = obj.get()['Body'].read()
            df.append(pd.read_csv(io.BytesIO(data), header=1,
                      delimiter=",", low_memory=False))

        postgres_hook = PostgresHook(postgres_conn_id="vislet_pg_conn")
        conn = postgres_hook.get_conn()
        cur = conn.cursor()
        # with open(data_path, "r") as file:
        #    cur.copy_expert(
        #        "COPY employees_temp FROM STDIN WITH CSV HEADER DELIMITER AS ',' QUOTE '\"'",
        #        file,
        #    )
        conn.commit()

    [create_sales_table] >> get_data()


dag = Etl()
