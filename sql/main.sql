drop database shop;

create database shop;
go

use shop;
go

create table Departments (
    DEPT_ID decimal(4,0) not null,
    NAME nvarchar(20),
    INFO nvarchar(40),
    constraint PK_DEPT_ID primary key clustered (DEPT_ID)
);

create table Workers(
    WORKERS_ID int not null,
    NAME nvarchar(20),
    ADDRESS nvarchar(40),
    DEPT_ID decimal(4,0),
    INFORMATION nvarchar(20),
    constraint PK_WORKERS_ID primary key clustered (WORKERS_ID),
    constraint FK_WORKERS_ID_TO_DEPT_ID foreign key (DEPT_ID) references Departments(DEPT_ID)
);

create table Goods(
    GOOD_ID int not null,
    NAME nvarchar(20),
    PRICE float,
    QUANTITY integer,
    PRODUCER nvarchar(20),
    DEPT_ID decimal(4,0),
    DESCRIPTION nvarchar(200),
    constraint PK_GOOD_ID primary key clustered (GOOD_ID),
    constraint FK_GOOD_ID_TO_DEPT_ID foreign key (DEPT_ID) references Departments(DEPT_ID)
);

create table Sales(
    SALE_ID int not null,
    CHECK_NO int not null,
    GOOD_ID int not null,
    DATE_SALE date not null,
    QUANTITY integer,
    constraint PK_SALE_ID primary key clustered (SALE_ID),
    constraint FK_SALE_ID_TO_GOOD_ID foreign key (GOOD_ID) references Goods(GOOD_ID)
);
go

